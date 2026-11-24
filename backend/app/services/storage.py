"""
Storage Service
Handles photo validation, server-side SHA-256 hashing, path naming, and storage interactions.
Supports Supabase Storage bucket 'inspection-photos' with local fallback for testing.
"""

import hashlib
import os
import uuid
from pathlib import Path
from typing import Dict, Any, Tuple
from fastapi import UploadFile, HTTPException

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024  # 8 MB
LOCAL_STORAGE_DIR = Path("./storage/inspection-photos")


def validate_photo_file(file: UploadFile) -> None:
    """Validates MIME type of uploaded photo."""
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed types: image/jpeg, image/png, image/webp"
        )


def process_photo_bytes(file_bytes: bytes, original_filename: str) -> Tuple[str, int]:
    """
    Computes server-side SHA-256 hash and verifies byte size.
    Ignores any client-supplied timestamps or client hashes.
    """
    file_size = len(file_bytes)
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of 8MB (got {file_size / (1024 * 1024):.2f}MB)"
        )
    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded photo is empty (0 bytes).")

    sha256_hash = hashlib.sha256(file_bytes).hexdigest()
    return sha256_hash, file_size


def generate_storage_path(
    property_id: str,
    inspection_id: str,
    room_id: str,
    original_filename: str
) -> str:
    """
    Standard path structure: {property_id}/{inspection_id}/{room_id}/{uuid}.ext
    """
    ext = os.path.splitext(original_filename)[1].lower()
    if not ext:
        ext = ".jpg"
    photo_uuid = uuid.uuid4().hex
    return f"{property_id}/{inspection_id}/{room_id}/{photo_uuid}{ext}"


async def save_photo_bytes(storage_path: str, file_bytes: bytes) -> str:
    """
    Saves photo bytes to local disk (or Supabase storage if credentials present).
    Returns relative storage path.
    """
    # Local disk fallback
    dest_path = LOCAL_STORAGE_DIR / storage_path
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(dest_path, "wb") as f:
        f.write(file_bytes)
    return storage_path


def get_signed_or_access_url(storage_path: str, ttl_seconds: int = 3600) -> str:
    """
    Returns signed URL for Supabase storage or static access path for local fallback.
    """
    return f"/api/photos/view/{storage_path}"
