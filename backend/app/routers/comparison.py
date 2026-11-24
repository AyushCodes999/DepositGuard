"""
Before & After AI Comparison Router
Compares Move-Out inspection items against the LOCKED Move-In inspection record.
Advisory only, labeled 'AI suggestion', stored in ai_comparisons table, never part of locked hash.
Uses GEMINI_MODEL_REASONING (gemini-3.8-flash) with maximum 4 images per comparison.
"""

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import (
    get_db, InspectionModel, RoomModel, RoomItemModel, AIComparisonModel,
    PropertyMemberModel, ProfileModel
)
from app.models.schemas import ComparisonItemResponse, ComparisonResponse
from app.middleware.auth import get_current_user
from app.services.ai_service import compare_item_conditions, batch_compare_item_conditions

router = APIRouter(prefix="/comparison", tags=["comparison"])


@router.post("/{move_out_inspection_id}", response_model=ComparisonResponse)
async def run_comparison(
    move_out_inspection_id: str,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Runs before/after comparison between locked move-in inspection and the move-out inspection
    using a SINGLE batched AI call to eliminate timeout and quota burn.
    """
    move_out = db.query(InspectionModel).filter(InspectionModel.id == move_out_inspection_id).first()
    if not move_out:
        raise HTTPException(status_code=404, detail="Move-out inspection not found.")

    if move_out.type != "move_out":
        raise HTTPException(status_code=400, detail="Target inspection must be a Move-Out inspection.")

    # Property membership check
    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == move_out.property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden.")

    # Find the locked move-in inspection for this property
    move_in = db.query(InspectionModel).filter(
        InspectionModel.property_id == move_out.property_id,
        InspectionModel.type == "move_in",
        InspectionModel.status == "locked"
    ).first()

    if not move_in:
        raise HTTPException(
            status_code=400,
            detail="No locked Move-In inspection record found for this property to compare against."
        )

    # Clear prior comparisons for this inspection to re-run fresh triage
    db.query(AIComparisonModel).filter(AIComparisonModel.inspection_id == move_out.id).delete()
    db.commit()

    # Index move-in items by room name and item name
    move_in_items_map = {}
    for r in move_in.rooms:
        for itm in r.items:
            key = (r.name.strip().lower(), itm.name.strip().lower())
            move_in_items_map[key] = itm

    # Collect all items across all rooms for a SINGLE batched call
    items_to_compare = []
    idx = 0
    for r in move_out.rooms:
        room_name = r.name
        for out_item in r.items:
            key = (room_name.strip().lower(), out_item.name.strip().lower())
            in_item = move_in_items_map.get(key)

            move_in_data = {
                "condition": in_item.condition if in_item else "clean_functional",
                "notes": in_item.notes if in_item else "Not documented at move-in",
                "photo_count": len(in_item.photos) if in_item else 0
            }

            move_out_data = {
                "condition": out_item.condition,
                "notes": out_item.notes,
                "photo_count": len(out_item.photos)
            }

            # Max 4 images (2 move-in, 2 move-out)
            photo_urls = []
            if in_item:
                for p in in_item.photos[:2]:
                    photo_urls.append(p.storage_path)
            for p in out_item.photos[:2]:
                photo_urls.append(p.storage_path)

            items_to_compare.append({
                "index": idx,
                "item_id": out_item.id,
                "move_in_item_id": in_item.id if in_item else None,
                "item_name": out_item.name,
                "room_name": room_name,
                "move_in_data": move_in_data,
                "move_out_data": move_out_data,
                "photos": photo_urls
            })
            idx += 1

    # Execute single batched Gemini call
    batch_results, model_used = await batch_compare_item_conditions(items_to_compare)

    # Store advisory comparisons in database
    results = []
    for itm, triage in zip(items_to_compare, batch_results):
        comp_id = str(uuid.uuid4())
        comp_record = AIComparisonModel(
            id=comp_id,
            inspection_id=move_out.id,
            move_in_item_id=itm["move_in_item_id"],
            move_out_item_id=itm["item_id"],
            item_name=itm["item_name"],
            room_name=itm["room_name"],
            change_type=triage["change_type"],
            confidence=triage["confidence"],
            rationale=triage["rationale"],
            ai_status=triage["ai_status"],
            model_used=triage["model_used"]
        )
        db.add(comp_record)
        db.flush()

        results.append(ComparisonItemResponse(
            id=comp_record.id,
            inspection_id=comp_record.inspection_id,
            move_in_item_id=comp_record.move_in_item_id,
            move_out_item_id=comp_record.move_out_item_id,
            item_name=comp_record.item_name,
            room_name=comp_record.room_name,
            change_type=comp_record.change_type,
            confidence=comp_record.confidence,
            rationale=comp_record.rationale,
            ai_status=comp_record.ai_status,
            model_used=comp_record.model_used,
            created_at=comp_record.created_at
        ))

    db.commit()

    return ComparisonResponse(
        inspection_id=move_out.id,
        move_in_inspection_id=move_in.id,
        total_items_compared=len(results),
        results=results
    )


@router.get("/{inspection_id}", response_model=List[ComparisonItemResponse])
def get_stored_comparisons(
    inspection_id: str,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches stored advisory comparisons for an inspection."""
    insp = db.query(InspectionModel).filter(InspectionModel.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found.")

    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == insp.property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden.")

    comparisons = db.query(AIComparisonModel).filter(
        AIComparisonModel.inspection_id == inspection_id
    ).order_by(AIComparisonModel.created_at.asc()).all()

    return [
        ComparisonItemResponse(
            id=c.id,
            inspection_id=c.inspection_id,
            move_in_item_id=c.move_in_item_id,
            move_out_item_id=c.move_out_item_id,
            item_name=c.item_name,
            room_name=c.room_name,
            change_type=c.change_type,
            confidence=c.confidence,
            rationale=c.rationale,
            ai_status=c.ai_status,
            model_used=c.model_used,
            created_at=c.created_at
        )
        for c in comparisons
    ]
