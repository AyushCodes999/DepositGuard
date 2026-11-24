"""
Inspection Router
Manages move-in & move-out inspections.
Pre-populates room-by-room items directly from RESEARCH NOTES/Research notes.txt.
Enforces post-lock immutability, approval state resets on edit,
and blocks duplicate active Move-In inspections for the same property.
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.database import (
    get_db, InspectionModel, RoomModel, RoomItemModel, PhotoModel,
    ApprovalModel, AmendmentModel, PropertyMemberModel, ProfileModel,
    PropertyModel, SettlementModel, AIComparisonModel
)
from app.models.schemas import (
    InspectionCreate, InspectionDetailResponse, RoomItemUpdate,
    RoomItemResponse, RoomResponse, PhotoResponse, ApprovalResponse,
    AmendmentResponse, RoomItemCreate
)
from app.middleware.auth import get_current_user
from app.services.room_templates import DEFAULT_ROOM_TEMPLATES
from app.services.storage import get_signed_or_access_url
from app.services.pdf_service import generate_inspection_pdf

router = APIRouter(prefix="/inspections", tags=["inspections"])


def format_inspection_detail(inspection: InspectionModel) -> InspectionDetailResponse:
    rooms_data = []
    for r in sorted(inspection.rooms, key=lambda x: x.room_order):
        items_data = []
        for item in sorted(r.items, key=lambda x: x.item_order):
            photos_data = [
                PhotoResponse(
                    id=p.id,
                    inspection_id=p.inspection_id,
                    room_id=p.room_id,
                    item_id=p.item_id,
                    storage_path=p.storage_path,
                    file_name=p.file_name,
                    file_size=p.file_size,
                    mime_type=p.mime_type,
                    sha256_hash=p.sha256_hash,
                    uploaded_by=p.uploaded_by,
                    created_at=p.created_at,
                    view_url=get_signed_or_access_url(p.storage_path)
                )
                for p in item.photos
            ]
            items_data.append(RoomItemResponse(
                id=item.id,
                room_id=item.room_id,
                name=item.name,
                condition=item.condition,
                notes=item.notes or "",
                item_order=item.item_order,
                created_at=item.created_at,
                updated_at=item.updated_at,
                photos=photos_data
            ))
        rooms_data.append(RoomResponse(
            id=r.id,
            inspection_id=r.inspection_id,
            name=r.name,
            room_order=r.room_order,
            created_at=r.created_at,
            items=items_data
        ))

    approvals_data = [
        ApprovalResponse(
            id=a.id,
            inspection_id=a.inspection_id,
            user_id=a.user_id,
            role=a.role,
            decision=a.decision,
            comments=a.comments,
            created_at=a.created_at
        )
        for a in inspection.approvals
    ]

    amendments_data = [
        AmendmentResponse(
            id=am.id,
            inspection_id=am.inspection_id,
            author_id=am.author_id,
            author_role=am.author_role,
            reason=am.reason,
            changed_fields=am.changed_fields,
            prev_hash=am.prev_hash,
            amendment_hash=am.amendment_hash,
            acknowledged_by=am.acknowledged_by,
            acknowledged_at=am.acknowledged_at,
            created_at=am.created_at
        )
        for am in inspection.amendments
    ]

    return InspectionDetailResponse(
        id=inspection.id,
        property_id=inspection.property_id,
        type=inspection.type,
        status=inspection.status,
        dispute_reason=inspection.dispute_reason,
        schema_version=inspection.schema_version,
        locked_hash=inspection.locked_hash,
        locked_at=inspection.locked_at,
        created_by=inspection.created_by,
        created_at=inspection.created_at,
        updated_at=inspection.updated_at,
        rooms=rooms_data,
        approvals=approvals_data,
        amendments=amendments_data
    )


@router.post("", response_model=InspectionDetailResponse, status_code=status.HTTP_201_CREATED)
def create_inspection(
    req: InspectionCreate,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify membership
    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == req.property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this property.")

    # Run 1 UX Bug Fix: Block creating duplicate Move-In inspections for the same property
    if req.type == "move_in":
        existing_move_in = db.query(InspectionModel).filter(
            InspectionModel.property_id == req.property_id,
            InspectionModel.type == "move_in"
        ).first()
        if existing_move_in:
            raise HTTPException(
                status_code=400,
                detail="An active Move-In inspection already exists for this property. Both tenant and landlord should collaborate on the existing shared inspection."
            )

    # For Move-Out inspections: Require that a locked Move-In inspection exists as baseline
    locked_move_in = None
    if req.type == "move_out":
        locked_move_in = db.query(InspectionModel).filter(
            InspectionModel.property_id == req.property_id,
            InspectionModel.type == "move_in",
            InspectionModel.status == "locked"
        ).first()
        if not locked_move_in:
            raise HTTPException(
                status_code=400,
                detail="A Move-Out inspection requires a locked, hash-verified Move-In inspection baseline."
            )

        existing_move_out = db.query(InspectionModel).filter(
            InspectionModel.property_id == req.property_id,
            InspectionModel.type == "move_out"
        ).first()
        if existing_move_out:
            raise HTTPException(
                status_code=400,
                detail="A Move-Out inspection already exists for this property. Open the existing Move-Out record."
            )

    inspection_id = str(uuid.uuid4())
    inspection = InspectionModel(
        id=inspection_id,
        property_id=req.property_id,
        type=req.type,
        status="draft",
        schema_version=1,
        created_by=user.id
    )
    db.add(inspection)

    # If move_out, clone rooms and items 1:1 from the locked move-in record
    if req.type == "move_out" and locked_move_in:
        for in_room in locked_move_in.rooms:
            out_room_id = str(uuid.uuid4())
            out_room = RoomModel(
                id=out_room_id,
                inspection_id=inspection_id,
                name=in_room.name,
                room_order=in_room.room_order
            )
            db.add(out_room)
            for in_item in in_room.items:
                out_item = RoomItemModel(
                    id=str(uuid.uuid4()),
                    room_id=out_room_id,
                    name=in_item.name,
                    condition="clean_functional",
                    notes="",
                    item_order=in_item.item_order
                )
                db.add(out_item)
    elif req.use_default_checklist:
        # Pre-populate move-in checklist using room-by-room items from research notes
        for r_tmpl in DEFAULT_ROOM_TEMPLATES:
            room_id = str(uuid.uuid4())
            room = RoomModel(
                id=room_id,
                inspection_id=inspection_id,
                name=r_tmpl["name"],
                room_order=r_tmpl["room_order"]
            )
            db.add(room)
            for itm in r_tmpl["items"]:
                item_obj = RoomItemModel(
                    id=str(uuid.uuid4()),
                    room_id=room_id,
                    name=itm["name"],
                    condition=itm.get("condition", "clean_functional"),
                    notes=itm.get("notes", ""),
                    item_order=itm["item_order"]
                )
                db.add(item_obj)

    db.commit()
    db.refresh(inspection)
    return format_inspection_detail(inspection)


@router.get("/{inspection_id}", response_model=InspectionDetailResponse)
def get_inspection(
    inspection_id: str,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inspection = db.query(InspectionModel).filter(InspectionModel.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection record not found.")

    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == inspection.property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden: You are not a member of this property.")

    return format_inspection_detail(inspection)


@router.get("/by-property/{property_id}", response_model=List[InspectionDetailResponse])
def list_inspections_for_property(
    property_id: str,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden: You are not a member of this property.")

    inspections = db.query(InspectionModel).filter(
        InspectionModel.property_id == property_id
    ).order_by(InspectionModel.created_at.desc()).all()

    return [format_inspection_detail(i) for i in inspections]


@router.patch("/{inspection_id}/items/{item_id}", response_model=RoomItemResponse)
def update_room_item(
    inspection_id: str,
    item_id: str,
    req: RoomItemUpdate,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inspection = db.query(InspectionModel).filter(InspectionModel.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found.")

    if inspection.status == "locked":
        raise HTTPException(
            status_code=400,
            detail="Operation rejected: This inspection is locked and immutable. Post-lock modifications must be added via amendments."
        )

    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == inspection.property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden.")

    item = db.query(RoomItemModel).filter(RoomItemModel.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")

    if req.name is not None:
        item.name = req.name
    if req.condition is not None:
        item.condition = req.condition
    if req.notes is not None:
        item.notes = req.notes
    if req.item_order is not None:
        item.item_order = req.item_order

    if inspection.status == "pending_approval":
        inspection.status = "draft"
        db.query(ApprovalModel).filter(ApprovalModel.inspection_id == inspection_id).delete()

    db.commit()
    db.refresh(item)

    photos_data = [
        PhotoResponse(
            id=p.id,
            inspection_id=p.inspection_id,
            room_id=p.room_id,
            item_id=p.item_id,
            storage_path=p.storage_path,
            file_name=p.file_name,
            file_size=p.file_size,
            mime_type=p.mime_type,
            sha256_hash=p.sha256_hash,
            uploaded_by=p.uploaded_by,
            created_at=p.created_at,
            view_url=get_signed_or_access_url(p.storage_path)
        )
        for p in item.photos
    ]

    return RoomItemResponse(
        id=item.id,
        room_id=item.room_id,
        name=item.name,
        condition=item.condition,
        notes=item.notes or "",
        item_order=item.item_order,
        created_at=item.created_at,
        updated_at=item.updated_at,
        photos=photos_data
    )


@router.post("/{inspection_id}/request-approval", response_model=InspectionDetailResponse)
def request_approval(
    inspection_id: str,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inspection = db.query(InspectionModel).filter(InspectionModel.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found.")

    if inspection.status == "locked":
        raise HTTPException(status_code=400, detail="Inspection is already locked.")

    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == inspection.property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden.")

    inspection.status = "pending_approval"
    inspection.dispute_reason = None
    db.commit()
    db.refresh(inspection)
    return format_inspection_detail(inspection)


@router.get("/{inspection_id}/export-pdf")
def export_inspection_pdf(
    inspection_id: str,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Direct PDF export endpoint for a specific inspection."""
    inspection = db.query(InspectionModel).filter(InspectionModel.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found.")

    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == inspection.property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Forbidden.")

    prop = db.query(PropertyModel).filter(PropertyModel.id == inspection.property_id).first()

    formatted = format_inspection_detail(inspection)
    insp_dict = formatted.dict()

    prop_dict = {
        "title": prop.title if prop else "Rental Property",
        "address": prop.address if prop else "",
        "city": prop.city if prop else "",
        "property_type": prop.property_type if prop else "flat"
    }

    # Fetch settlement if exists
    settlement = db.query(SettlementModel).filter(SettlementModel.property_id == inspection.property_id).first()
    settle_dict = {
        "original_deposit": settlement.original_deposit,
        "total_deductions": settlement.total_deductions,
        "refund_amount": settlement.refund_amount,
        "status": settlement.status
    } if settlement else None

    # Fetch AI comparisons if move_out inspection
    comps = db.query(AIComparisonModel).filter(AIComparisonModel.inspection_id == inspection.id).all()
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

    filename = f"DepositGuard_{inspection.type.title()}_{inspection.id[:8]}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
