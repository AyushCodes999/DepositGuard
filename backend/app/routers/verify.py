"""
Verification Router
Recomputes the canonical SHA-256 hash from DB records and verifies against stored locked_hash.
Proves tamper-evident integrity without legal enforcement guarantees.
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, InspectionModel, ApprovalModel
from app.models.schemas import VerificationResponse
from app.middleware.auth import get_current_user
from app.services.canonical import build_canonical_payload, compute_sha256

router = APIRouter(prefix="/inspections", tags=["verification"])


@router.get("/{inspection_id}/verify", response_model=VerificationResponse)
def verify_inspection_hash(
    inspection_id: str,
    db: Session = Depends(get_db)
):
    """
    Recomputes the canonical SHA-256 hash of the inspection and validates it
    against the stored locked_hash.
    Publicly accessible or authenticated for third-party dispute verification.
    """
    inspection = db.query(InspectionModel).filter(InspectionModel.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found.")

    if inspection.status != "locked" or not inspection.locked_hash:
        return VerificationResponse(
            inspection_id=inspection.id,
            status=inspection.status,
            is_locked=False,
            stored_hash=None,
            computed_hash=None,
            is_tamper_free=False,
            message="Inspection is not locked yet. Dual-confirmation lock has not been engaged.",
            verified_at=datetime.now(timezone.utc)
        )

    # Reconstruct canonical payload from current DB state
    rooms_list = []
    items_by_room = {}
    photos_by_item = {}

    for r in sorted(inspection.rooms, key=lambda x: x.room_order):
        rooms_list.append({"id": r.id, "name": r.name, "room_order": r.room_order})
        items_by_room[r.id] = []
        for item in sorted(r.items, key=lambda x: x.item_order):
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

    approvals = db.query(ApprovalModel).filter(
        ApprovalModel.inspection_id == inspection_id,
        ApprovalModel.decision == "approved"
    ).all()

    approvals_list = [
        {"user_id": a.user_id, "role": a.role, "decision": a.decision}
        for a in approvals
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

    computed_hash = compute_sha256(canonical_payload)
    is_match = (computed_hash == inspection.locked_hash)

    return VerificationResponse(
        inspection_id=inspection.id,
        status="locked",
        is_locked=True,
        stored_hash=inspection.locked_hash,
        computed_hash=computed_hash,
        is_tamper_free=is_match,
        message="Cryptographic signature verified: Record is intact and untampered." if is_match else "Integrity alert: Stored hash does not match recomputed payload hash!",
        verified_at=datetime.now(timezone.utc)
    )
