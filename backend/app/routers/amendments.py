"""
Amendments Router
Append-only chain for post-lock changes. Never mutates the locked record.
Chains to the locked_hash or the latest amendment hash.
"""

from datetime import datetime, timezone
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import (
    get_db, InspectionModel, AmendmentModel, PropertyMemberModel, ProfileModel
)
from app.models.schemas import AmendmentCreate, AmendmentResponse
from app.middleware.auth import get_current_user
from app.services.canonical import compute_amendment_hash

router = APIRouter(prefix="/amendments", tags=["amendments"])


@router.post("/{inspection_id}", response_model=AmendmentResponse, status_code=status.HTTP_201_CREATED)
def create_amendment(
    inspection_id: str,
    req: AmendmentCreate,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Appends an amendment to a locked inspection.
    Never alters the locked record.
    Chains prev_hash to either the locked_hash or the latest amendment hash.
    """
    inspection = db.query(InspectionModel).filter(InspectionModel.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found.")

    if inspection.status != "locked":
        raise HTTPException(
            status_code=400,
            detail="Amendments can only be filed against locked inspection records."
        )

    # Check property membership
    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == inspection.property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden.")

    # Find previous hash in the chain
    latest_amendment = db.query(AmendmentModel).filter(
        AmendmentModel.inspection_id == inspection_id
    ).order_by(AmendmentModel.created_at.desc()).first()

    if latest_amendment:
        prev_hash = latest_amendment.amendment_hash
    else:
        prev_hash = inspection.locked_hash or "genesis"

    now_time = datetime.now(timezone.utc)
    now_iso = now_time.isoformat()

    amendment_hash = compute_amendment_hash(
        prev_hash=prev_hash,
        changed_fields=req.changed_fields,
        author_id=user.id,
        reason=req.reason,
        created_at_iso=now_iso
    )

    amendment = AmendmentModel(
        id=str(uuid.uuid4()),
        inspection_id=inspection_id,
        author_id=user.id,
        author_role=member.role,
        reason=req.reason,
        changed_fields=req.changed_fields,
        prev_hash=prev_hash,
        amendment_hash=amendment_hash,
        created_at=now_time
    )
    db.add(amendment)
    db.commit()
    db.refresh(amendment)

    return AmendmentResponse(
        id=amendment.id,
        inspection_id=amendment.inspection_id,
        author_id=amendment.author_id,
        author_role=amendment.author_role,
        reason=amendment.reason,
        changed_fields=amendment.changed_fields,
        prev_hash=amendment.prev_hash,
        amendment_hash=amendment.amendment_hash,
        acknowledged_by=amendment.acknowledged_by,
        acknowledged_at=amendment.acknowledged_at,
        created_at=amendment.created_at
    )


@router.post("/item/{amendment_id}/acknowledge", response_model=AmendmentResponse)
def acknowledge_amendment(
    amendment_id: str,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Acknowledges an amendment by the co-party (non-author)."""
    amendment = db.query(AmendmentModel).filter(AmendmentModel.id == amendment_id).first()
    if not amendment:
        raise HTTPException(status_code=404, detail="Amendment not found.")

    if amendment.author_id == user.id:
        raise HTTPException(
            status_code=400,
            detail="The author of an amendment cannot acknowledge their own amendment."
        )

    # Check membership of the inspection's property
    inspection = db.query(InspectionModel).filter(InspectionModel.id == amendment.inspection_id).first()
    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == inspection.property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden.")

    amendment.acknowledged_by = user.id
    amendment.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(amendment)

    return AmendmentResponse(
        id=amendment.id,
        inspection_id=amendment.inspection_id,
        author_id=amendment.author_id,
        author_role=amendment.author_role,
        reason=amendment.reason,
        changed_fields=amendment.changed_fields,
        prev_hash=amendment.prev_hash,
        amendment_hash=amendment.amendment_hash,
        acknowledged_by=amendment.acknowledged_by,
        acknowledged_at=amendment.acknowledged_at,
        created_at=amendment.created_at
    )
