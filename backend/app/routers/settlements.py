"""
Settlement & PDF Export Router
Manages deposit settlement agreements, itemized deductions, and ReportLab PDF downloads.
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.database import (
    get_db, SettlementModel, PropertyModel, InspectionModel,
    PropertyMemberModel, ProfileModel, AIComparisonModel
)
from app.models.schemas import (
    SettlementCreate, SettlementUpdate, SettlementResponse, DeductionItem
)
from app.middleware.auth import get_current_user
from app.services.pdf_service import generate_inspection_pdf

router = APIRouter(prefix="/settlements", tags=["settlements"])


@router.get("/{property_id}", response_model=Optional[SettlementResponse])
def get_settlement(
    property_id: str,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden.")

    settlement = db.query(SettlementModel).filter(SettlementModel.property_id == property_id).first()
    if not settlement:
        return None

    return SettlementResponse(
        id=settlement.id,
        property_id=settlement.property_id,
        move_in_inspection_id=settlement.move_in_inspection_id,
        move_out_inspection_id=settlement.move_out_inspection_id,
        original_deposit=settlement.original_deposit,
        proposed_deductions=settlement.proposed_deductions or [],
        total_deductions=settlement.total_deductions,
        refund_amount=settlement.refund_amount,
        status=settlement.status,
        created_at=settlement.created_at,
        updated_at=settlement.updated_at
    )


@router.post("/{property_id}", response_model=SettlementResponse)
def create_or_update_settlement(
    property_id: str,
    req: SettlementCreate,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden.")

    deductions_list = [d.dict() for d in req.proposed_deductions]
    total_deductions = sum(float(d.get("amount", 0.0)) for d in deductions_list)
    refund_amount = max(0.0, req.original_deposit - total_deductions)

    settlement = db.query(SettlementModel).filter(SettlementModel.property_id == property_id).first()
    if not settlement:
        settlement = SettlementModel(
            id=str(uuid.uuid4()),
            property_id=property_id,
            move_in_inspection_id=req.move_in_inspection_id,
            move_out_inspection_id=req.move_out_inspection_id,
            original_deposit=req.original_deposit,
            proposed_deductions=deductions_list,
            total_deductions=total_deductions,
            refund_amount=refund_amount,
            status="draft"
        )
        db.add(settlement)
    else:
        settlement.move_in_inspection_id = req.move_in_inspection_id
        settlement.move_out_inspection_id = req.move_out_inspection_id or settlement.move_out_inspection_id
        settlement.original_deposit = req.original_deposit
        settlement.proposed_deductions = deductions_list
        settlement.total_deductions = total_deductions
        settlement.refund_amount = refund_amount

    db.commit()
    db.refresh(settlement)

    return SettlementResponse(
        id=settlement.id,
        property_id=settlement.property_id,
        move_in_inspection_id=settlement.move_in_inspection_id,
        move_out_inspection_id=settlement.move_out_inspection_id,
        original_deposit=settlement.original_deposit,
        proposed_deductions=settlement.proposed_deductions or [],
        total_deductions=settlement.total_deductions,
        refund_amount=settlement.refund_amount,
        status=settlement.status,
        created_at=settlement.created_at,
        updated_at=settlement.updated_at
    )


@router.patch("/{property_id}", response_model=SettlementResponse)
def patch_settlement(
    property_id: str,
    req: SettlementUpdate,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden.")

    settlement = db.query(SettlementModel).filter(SettlementModel.property_id == property_id).first()
    if not settlement:
        raise HTTPException(status_code=404, detail="Settlement not found.")

    if req.original_deposit is not None:
        settlement.original_deposit = req.original_deposit
    if req.proposed_deductions is not None:
        deductions_list = [d.dict() for d in req.proposed_deductions]
        settlement.proposed_deductions = deductions_list
        settlement.total_deductions = sum(float(d.get("amount", 0.0)) for d in deductions_list)
        settlement.refund_amount = max(0.0, settlement.original_deposit - settlement.total_deductions)
    if req.status is not None:
        settlement.status = req.status

    db.commit()
    db.refresh(settlement)

    return SettlementResponse(
        id=settlement.id,
        property_id=settlement.property_id,
        move_in_inspection_id=settlement.move_in_inspection_id,
        move_out_inspection_id=settlement.move_out_inspection_id,
        original_deposit=settlement.original_deposit,
        proposed_deductions=settlement.proposed_deductions or [],
        total_deductions=settlement.total_deductions,
        refund_amount=settlement.refund_amount,
        status=settlement.status,
        created_at=settlement.created_at,
        updated_at=settlement.updated_at
    )


@router.get("/{property_id}/export-pdf")
def export_settlement_pdf(
    property_id: str,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generates and downloads a tamper-evident PDF inspection & settlement report."""
    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden.")

    prop = db.query(PropertyModel).filter(PropertyModel.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    # Find primary move-in inspection
    inspection = db.query(InspectionModel).filter(
        InspectionModel.property_id == property_id,
        InspectionModel.type == "move_in"
    ).order_by(InspectionModel.created_at.desc()).first()

    if not inspection:
        raise HTTPException(status_code=404, detail="No Move-In inspection found for PDF generation.")

    # Convert inspection to dict
    from app.routers.inspections import format_inspection_detail
    formatted = format_inspection_detail(inspection)
    insp_dict = formatted.dict()

    prop_dict = {
        "title": prop.title,
        "address": prop.address,
        "city": prop.city,
        "property_type": prop.property_type
    }

    settlement = db.query(SettlementModel).filter(SettlementModel.property_id == property_id).first()
    settle_dict = {
        "original_deposit": settlement.original_deposit,
        "total_deductions": settlement.total_deductions,
        "refund_amount": settlement.refund_amount,
        "status": settlement.status
    } if settlement else None

    # Fetch AI comparisons if any move-out exists
    move_out = db.query(InspectionModel).filter(
        InspectionModel.property_id == property_id,
        InspectionModel.type == "move_out"
    ).first()

    ai_comps = []
    if move_out:
        comps = db.query(AIComparisonModel).filter(AIComparisonModel.inspection_id == move_out.id).all()
        ai_comps = [
            {
                "item_name": c.item_name,
                "room_name": c.room_name,
                "change_type": c.change_type,
                "confidence": c.confidence,
                "rationale": c.rationale
            }
            for c in comps
        ]

    pdf_bytes = generate_inspection_pdf(
        inspection_data=insp_dict,
        property_data=prop_dict,
        settlement_data=settle_dict,
        ai_comparisons=ai_comps
    )

    filename = f"DepositGuard_Report_{prop.title.replace(' ', '_')}_{inspection.id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
