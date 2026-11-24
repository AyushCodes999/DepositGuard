"""
Photos Router
Handles photo upload, server-side SHA-256 calculation, and photo retrieval.
Enforces max 8 MB, allowed MIME types, and immutability guards.
"""

import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import (
    get_db, InspectionModel, RoomModel, RoomItemModel, PhotoModel,
    PropertyMemberModel, ProfileModel, ApprovalModel
)
from app.models.schemas import PhotoResponse
from app.middleware.auth import get_current_user
from app.services.storage import (
    validate_photo_file, process_photo_bytes, generate_storage_path,
    save_photo_bytes, get_signed_or_access_url, LOCAL_STORAGE_DIR
)

router = APIRouter(prefix="/photos", tags=["photos"])


@router.post("/upload", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    inspection_id: str = Form(...),
    item_id: str = Form(...),
    file: UploadFile = File(...),
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Uploads photo for a checklist item.
    - Computes server-side SHA-256 and server timestamp.
    - Rejects if inspection is locked.
    - Resets approvals to draft if currently pending_approval.
    """
    inspection = db.query(InspectionModel).filter(InspectionModel.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found.")

    if inspection.status == "locked":
        raise HTTPException(
            status_code=400,
            detail="Operation rejected: Inspection is locked and immutable."
        )

    # Check property membership
    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == inspection.property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden.")

    item = db.query(RoomItemModel).filter(RoomItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")

    room = db.query(RoomModel).filter(RoomModel.id == item.room_id).first()
    room_id = room.id if room else "general"

    # Validate file type
    validate_photo_file(file)

    # Read and hash bytes
    file_bytes = await file.read()
    sha256_hash, file_size = process_photo_bytes(file_bytes, file.filename or "photo.jpg")

    # Generate storage path: {property_id}/{inspection_id}/{room_id}/{uuid}.ext
    storage_path = generate_storage_path(
        property_id=inspection.property_id,
        inspection_id=inspection_id,
        room_id=room_id,
        original_filename=file.filename or "photo.jpg"
    )

    # Save bytes
    await save_photo_bytes(storage_path, file_bytes)

    # Record photo in database
    photo_id = str(uuid.uuid4())
    photo = PhotoModel(
        id=photo_id,
        inspection_id=inspection_id,
        room_id=room_id,
        item_id=item_id,
        storage_path=storage_path,
        file_name=file.filename or "photo.jpg",
        file_size=file_size,
        mime_type=file.content_type,
        sha256_hash=sha256_hash,
        uploaded_by=user.id
    )
    db.add(photo)

    # If pending_approval, reset to draft
    if inspection.status == "pending_approval":
        inspection.status = "draft"
        db.query(ApprovalModel).filter(ApprovalModel.inspection_id == inspection_id).delete()

    db.commit()
    db.refresh(photo)

    return PhotoResponse(
        id=photo.id,
        inspection_id=photo.inspection_id,
        room_id=photo.room_id,
        item_id=photo.item_id,
        storage_path=photo.storage_path,
        file_name=photo.file_name,
        file_size=photo.file_size,
        mime_type=photo.mime_type,
        sha256_hash=photo.sha256_hash,
        uploaded_by=photo.uploaded_by,
        created_at=photo.created_at,
        view_url=get_signed_or_access_url(photo.storage_path)
    )


@router.get("/view/{file_path:path}")
def view_photo(file_path: str):
    """Serves the uploaded inspection photo."""
    full_path = LOCAL_STORAGE_DIR / file_path
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="Photo file not found.")
    return FileResponse(path=str(full_path))
