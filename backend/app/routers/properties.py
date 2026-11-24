"""
Property Router
Manages rental properties, landlord ownership, and tenant invite codes.
Assumptions:
- Landlord creates a property and invites tenant by invite code.
- Strictly one landlord and one tenant per property.
"""

import secrets
import string
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db, PropertyModel, PropertyMemberModel, ProfileModel
from app.models.schemas import PropertyCreate, PropertyJoinRequest, PropertyResponse
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/properties", tags=["properties"])


def generate_invite_code(length: int = 6) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
def create_property(
    req: PropertyCreate,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Landlord creates property and becomes primary landlord member."""
    if user.role != "landlord":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only users with the landlord role can create a new property."
        )

    prop_id = str(uuid.uuid4())
    invite_code = generate_invite_code()

    # Ensure invite code uniqueness
    while db.query(PropertyModel).filter(PropertyModel.invite_code == invite_code).first():
        invite_code = generate_invite_code()

    property_obj = PropertyModel(
        id=prop_id,
        landlord_id=user.id,
        title=req.title,
        address=req.address,
        city=req.city,
        property_type=req.property_type,
        invite_code=invite_code
    )
    db.add(property_obj)

    # Add landlord to property_members
    member_obj = PropertyMemberModel(
        id=str(uuid.uuid4()),
        property_id=prop_id,
        user_id=user.id,
        role="landlord"
    )
    db.add(member_obj)
    db.commit()
    db.refresh(property_obj)

    return PropertyResponse(
        id=property_obj.id,
        landlord_id=property_obj.landlord_id,
        title=property_obj.title,
        address=property_obj.address,
        city=property_obj.city,
        property_type=property_obj.property_type,
        invite_code=property_obj.invite_code,
        created_at=property_obj.created_at,
        updated_at=property_obj.updated_at,
        members=[{"user_id": user.id, "role": user.role, "full_name": user.full_name, "email": user.email}]
    )


@router.get("", response_model=List[PropertyResponse])
def list_properties(
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns all properties where user is a member (landlord or tenant)."""
    memberships = db.query(PropertyMemberModel).filter(PropertyMemberModel.user_id == user.id).all()
    property_ids = [m.property_id for m in memberships]

    properties = db.query(PropertyModel).filter(PropertyModel.id.in_(property_ids)).all()
    results = []
    for prop in properties:
        members_data = []
        for m in prop.members:
            u = db.query(ProfileModel).filter(ProfileModel.id == m.user_id).first()
            members_data.append({
                "user_id": m.user_id,
                "role": m.role,
                "full_name": u.full_name if u else "",
                "email": u.email if u else ""
            })
        results.append(PropertyResponse(
            id=prop.id,
            landlord_id=prop.landlord_id,
            title=prop.title,
            address=prop.address,
            city=prop.city,
            property_type=prop.property_type,
            invite_code=prop.invite_code,
            created_at=prop.created_at,
            updated_at=prop.updated_at,
            members=members_data
        ))
    return results


@router.get("/explore")
def get_explore_properties(db: Session = Depends(get_db)):
    """Public explore endpoint returning all listed properties with landlord info for exploration."""
    properties = db.query(PropertyModel).order_by(PropertyModel.created_at.desc()).all()
    results = []
    for prop in properties:
        landlord = db.query(ProfileModel).filter(ProfileModel.id == prop.landlord_id).first()
        results.append({
            "id": prop.id,
            "title": prop.title,
            "address": prop.address,
            "city": prop.city,
            "property_type": prop.property_type,
            "invite_code": prop.invite_code,
            "landlord_name": landlord.full_name if landlord and landlord.full_name else "Verified Landlord",
            "landlord_email": landlord.email if landlord and landlord.email else None,
            "landlord_phone": landlord.phone if landlord and hasattr(landlord, "phone") and landlord.phone else None,
            "created_at": prop.created_at.isoformat() if prop.created_at else None
        })
    return results


@router.post("/join", response_model=PropertyResponse)
def join_property_by_invite(
    req: PropertyJoinRequest,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Tenant joins property via 6-digit invite code. Enforces 1 tenant max."""
    code = req.invite_code.strip().upper()
    prop = db.query(PropertyModel).filter(PropertyModel.invite_code == code).first()
    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property invite code not found. Please verify with the landlord."
        )

    # Check if user already joined
    existing_membership = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == prop.id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if existing_membership:
        # Already member, return property
        return PropertyResponse(
            id=prop.id,
            landlord_id=prop.landlord_id,
            title=prop.title,
            address=prop.address,
            city=prop.city,
            property_type=prop.property_type,
            invite_code=prop.invite_code,
            created_at=prop.created_at,
            updated_at=prop.updated_at
        )

    # Enforce strictly 1 tenant per property
    existing_tenant = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == prop.id,
        PropertyMemberModel.role == "tenant"
    ).first()
    if existing_tenant and user.role == "tenant":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This property already has an active tenant assigned."
        )

    new_member = PropertyMemberModel(
        id=str(uuid.uuid4()),
        property_id=prop.id,
        user_id=user.id,
        role=user.role
    )
    db.add(new_member)
    db.commit()
    db.refresh(prop)

    return PropertyResponse(
        id=prop.id,
        landlord_id=prop.landlord_id,
        title=prop.title,
        address=prop.address,
        city=prop.city,
        property_type=prop.property_type,
        invite_code=prop.invite_code,
        created_at=prop.created_at,
        updated_at=prop.updated_at
    )


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(
    property_id: str,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == property_id,
        PropertyMemberModel.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You are not a registered member of this property."
        )

    prop = db.query(PropertyModel).filter(PropertyModel.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    members_data = []
    for m in prop.members:
        u = db.query(ProfileModel).filter(ProfileModel.id == m.user_id).first()
        members_data.append({
            "user_id": m.user_id,
            "role": m.role,
            "full_name": u.full_name if u else "",
            "email": u.email if u else ""
        })

    return PropertyResponse(
        id=prop.id,
        landlord_id=prop.landlord_id,
        title=prop.title,
        address=prop.address,
        city=prop.city,
        property_type=prop.property_type,
        invite_code=prop.invite_code,
        created_at=prop.created_at,
        updated_at=prop.updated_at,
        members=members_data
    )
