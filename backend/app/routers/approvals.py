"""
Approvals and Dual-Confirmation Lock Router
Implements the core signature feature:
- State machine: draft -> pending_approval -> locked | disputed
- Either party can reject with reason (-> disputed, then back to draft)
- On second approval: builds canonical payload, serializes canonical JSON, computes SHA-256,
  locks record in one atomic transaction.
"""

from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import (
    get_db, InspectionModel, ApprovalModel, PropertyMemberModel, ProfileModel
)
from app.models.schemas import ApprovalCreate, ApprovalResponse, InspectionDetailResponse
from app.middleware.auth import get_current_user
from app.routers.inspections import format_inspection_detail
from app.services.canonical import build_canonical_payload, compute_sha256

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.post("/{inspection_id}", response_model=InspectionDetailResponse)
def submit_approval(
    inspection_id: str,
    req: ApprovalCreate,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Submits tenant or landlord approval/rejection.
    If decision == 'rejected':
      - Inspection status transitions to 'disputed' with dispute_reason recorded.
      - Approvals are invalidated.
    If decision == 'approved':
      - Records approval.
      - If both Tenant and Landlord have approved:
        Executes atomic dual-confirmation lock transaction:
        1. Compiles canonical payload of all rooms, items, notes, photo hashes, approvers.
        2. Computes SHA-256 canonical hash.
        3. Sets status='locked', locked_hash, locked_at timestamp.
    """
    # Fetch inspection with row lock
    inspection = db.query(InspectionModel).filter(InspectionModel.id == inspection_id).with_for_update().first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found.")

    if inspection.status == "locked":
        raise HTTPException(status_code=400, detail="Inspection is already locked.")

    # Verify membership and get role in this property
    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == inspection.property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden: You are not a member of this property.")

    user_role = member.role  # 'tenant' or 'landlord'

    # Handle rejection
    if req.decision == "rejected":
        inspection.status = "disputed"
        inspection.dispute_reason = req.comments or "Rejected by party without detailed remarks."
        # Reset any prior approvals
        db.query(ApprovalModel).filter(ApprovalModel.inspection_id == inspection_id).delete()
        db.commit()
        db.refresh(inspection)
        return format_inspection_detail(inspection)

    # Handle approval
    # Upsert current user's approval
    approval = db.query(ApprovalModel).filter(
        ApprovalModel.inspection_id == inspection_id,
        ApprovalModel.user_id == user.id
    ).first()

    if not approval:
        approval = ApprovalModel(
            id=str(uuid.uuid4()),
            inspection_id=inspection_id,
            user_id=user.id,
            role=user_role,
            decision="approved",
            comments=req.comments
        )
        db.add(approval)
    else:
        approval.decision = "approved"
        approval.comments = req.comments
        approval.created_at = datetime.now(timezone.utc)

    db.flush()

    # Query all current approvals for this inspection
    all_approvals = db.query(ApprovalModel).filter(
        ApprovalModel.inspection_id == inspection_id,
        ApprovalModel.decision == "approved"
    ).all()

    has_tenant_approved = any(a.role == "tenant" for a in all_approvals)
    has_landlord_approved = any(a.role == "landlord" for a in all_approvals)

    # Check if both have approved -> ENGAGE DUAL-CONFIRMATION LOCK
    if has_tenant_approved and has_landlord_approved:
        # Build canonical payload
        rooms_list = []
        items_by_room = {}
        photos_by_item = {}

        for r in inspection.rooms:
            rooms_list.append({"id": r.id, "name": r.name, "room_order": r.room_order})
            items_by_room[r.id] = []
            for item in r.items:
                items_by_room[r.id].append({
                    "id": item.id,
                    "name": item.name,
                    "condition": item.condition,
                    "notes": item.notes or "",
                    "item_order": item.item_order
                })
                photos_by_item[item.id] = [
                    {
                        "id": p.id,
                        "sha256_hash": p.sha256_hash,
                        "storage_path": p.storage_path,
                        "uploaded_by": p.uploaded_by
                    }
                    for p in item.photos
                ]

        approvals_list = [
            {"user_id": a.user_id, "role": a.role, "decision": a.decision}
            for a in all_approvals
        ]

        canonical_payload = build_canonical_payload(
            inspection={
                "id": inspection.id,
                "property_id": inspection.property_id,
                "type": inspection.type,
                "created_by": inspection.created_by
            },
            rooms=rooms_list,
            items_by_room=items_by_room,
            photos_by_item=photos_by_item,
            approvals=approvals_list,
            schema_version=inspection.schema_version
        )

        canonical_hash = compute_sha256(canonical_payload)
        lock_time = datetime.now(timezone.utc)

        inspection.status = "locked"
        inspection.locked_hash = canonical_hash
        inspection.locked_at = lock_time
        inspection.dispute_reason = None
    else:
        # One party approved, now pending the other
        inspection.status = "pending_approval"

    db.commit()
    db.refresh(inspection)
    return format_inspection_detail(inspection)
