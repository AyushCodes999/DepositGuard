"""
Pydantic v2 Schemas for DepositGuard
Validates inputs and outputs across all endpoints.
Run 2 Update: Added GuardBot, AI Structured Note, Before/After Comparison, and Settlement schemas.
"""

from typing import List, Optional, Any, Dict
from datetime import datetime
import uuid
from pydantic import BaseModel, Field, EmailStr


# =============================================================================
# Auth & User Schemas
# =============================================================================
class SendOtpRequest(BaseModel):
    email: EmailStr
    purpose: Optional[str] = "registration"


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)
    purpose: Optional[str] = "registration"


class OtpResponse(BaseModel):
    success: bool
    message: str
    email: str
    dev_code: Optional[str] = None
    verification_token: Optional[str] = None


class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)
    phone: Optional[str] = None
    role: str = Field(pattern="^(tenant|landlord)$")
    otp_token: Optional[str] = None


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: str
    email_verified: bool = True
    created_at: datetime


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: ProfileResponse


# =============================================================================
# Property Schemas
# =============================================================================
class PropertyCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    address: str = Field(min_length=5)
    city: str = Field(min_length=2)
    property_type: str = Field(default="flat", pattern="^(flat|pg|independent_house)$")


class PropertyJoinRequest(BaseModel):
    invite_code: str = Field(min_length=4)


class PropertyResponse(BaseModel):
    id: str
    landlord_id: str
    title: str
    address: str
    city: str
    property_type: str
    invite_code: str
    created_at: datetime
    updated_at: datetime
    members: Optional[List[Dict[str, Any]]] = None


# =============================================================================
# Checklist & Room Item Schemas
# =============================================================================
class RoomItemCreate(BaseModel):
    name: str = Field(min_length=2)
    condition: str = Field(
        default="clean_functional",
        pattern="^(clean_functional|minor_wear|damaged|not_working|not_applicable)$"
    )
    notes: Optional[str] = ""
    item_order: int = 0


class RoomItemUpdate(BaseModel):
    name: Optional[str] = None
    condition: Optional[str] = Field(
        default=None,
        pattern="^(clean_functional|minor_wear|damaged|not_working|not_applicable)$"
    )
    notes: Optional[str] = None
    item_order: Optional[int] = None


class PhotoResponse(BaseModel):
    id: str
    inspection_id: str
    room_id: Optional[str] = None
    item_id: Optional[str] = None
    storage_path: str
    file_name: str
    file_size: int
    mime_type: str
    sha256_hash: str
    uploaded_by: str
    created_at: datetime
    view_url: Optional[str] = None


class RoomItemResponse(BaseModel):
    id: str
    room_id: str
    name: str
    condition: str
    notes: str
    item_order: int
    created_at: datetime
    updated_at: datetime
    photos: List[PhotoResponse] = []


class RoomResponse(BaseModel):
    id: str
    inspection_id: str
    name: str
    room_order: int
    created_at: datetime
    items: List[RoomItemResponse] = []


# =============================================================================
# Inspection Schemas
# =============================================================================
class InspectionCreate(BaseModel):
    property_id: str
    type: str = Field(default="move_in", pattern="^(move_in|move_out)$")
    use_default_checklist: bool = True


class ApprovalCreate(BaseModel):
    decision: str = Field(pattern="^(approved|rejected)$")
    comments: Optional[str] = None


class ApprovalResponse(BaseModel):
    id: str
    inspection_id: str
    user_id: str
    role: str
    decision: str
    comments: Optional[str] = None
    created_at: datetime


class AmendmentCreate(BaseModel):
    reason: str = Field(min_length=5, max_length=500)
    changed_fields: Dict[str, Any]


class AmendmentResponse(BaseModel):
    id: str
    inspection_id: str
    author_id: str
    author_role: str
    reason: str
    changed_fields: Dict[str, Any]
    prev_hash: str
    amendment_hash: str
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    created_at: datetime


class InspectionDetailResponse(BaseModel):
    id: str
    property_id: str
    type: str
    status: str
    dispute_reason: Optional[str] = None
    schema_version: int
    locked_hash: Optional[str] = None
    locked_at: Optional[datetime] = None
    created_by: str
    created_at: datetime
    updated_at: datetime
    rooms: List[RoomResponse] = []
    approvals: List[ApprovalResponse] = []
    amendments: List[AmendmentResponse] = []


class VerificationResponse(BaseModel):
    inspection_id: str
    status: str
    is_locked: bool
    stored_hash: Optional[str] = None
    computed_hash: Optional[str] = None
    is_tamper_free: bool
    message: str
    verified_at: datetime
    tamper_evident_notice: str = "DepositGuard verification confirms cryptographic payload integrity. Tamper-evident, not tamper-proof; documentation, not legal advice."


# =============================================================================
# Run 2: GuardBot Chatbot Schemas
# =============================================================================
class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|model)$")
    content: str


class GuardBotChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


class GuardBotChatResponse(BaseModel):
    reply: str
    latency_ms: int
    model_used: str
    disclaimer: str = "GuardBot provides neutral documentation guidance under Model Tenancy Act principles, not legal advice."


class GuardBotErrorResponse(BaseModel):
    error_code: str  # invalid_input, rate_limited, timeout, upstream_unavailable
    detail: str
    retry_allowed: bool = True


# =============================================================================
# Run 2: AI Structured Note Schemas (Fast Model: gemini-3.5-flash-lite)
# =============================================================================
class NoteStructureRequest(BaseModel):
    rough_notes: str
    item_name: Optional[str] = None


class StructuredNoteData(BaseModel):
    condition: str = Field(
        default="clean_functional",
        pattern="^(clean_functional|minor_wear|damaged|not_working|not_applicable)$"
    )
    clean_notes: str
    tags: List[str] = []


class NoteStructureResponse(BaseModel):
    ai_status: str  # success, failed
    data: Optional[StructuredNoteData] = None
    raw_notes: str
    model_used: str


# =============================================================================
# Run 2: Before/After AI Comparison Schemas (Reasoning Model: gemini-3.8-flash)
# =============================================================================
class ComparisonItemResponse(BaseModel):
    id: str
    inspection_id: str
    move_in_item_id: Optional[str] = None
    move_out_item_id: Optional[str] = None
    item_name: str
    room_name: str
    change_type: str = Field(
        pattern="^(none|normal_wear|possible_damage|unclear)$"
    )
    confidence: float
    rationale: str
    ai_status: str
    model_used: str
    created_at: datetime
    disclaimer: str = "Advisory only - AI suggestion. Stored separately and never part of the locked cryptographic record."


class ComparisonResponse(BaseModel):
    inspection_id: str
    move_in_inspection_id: str
    total_items_compared: int
    results: List[ComparisonItemResponse]


# =============================================================================
# Run 2: Settlement & Deduction Schemas
# =============================================================================
class DeductionItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: str = Field(default="damage", pattern="^(painting|cleaning|damage|utility_arrears|missing_inventory|other)$")
    description: str
    amount: float = Field(ge=0.0)
    is_normal_wear_and_tear: bool = False
    evidence_notes: Optional[str] = ""


class SettlementCreate(BaseModel):
    property_id: str
    move_in_inspection_id: str
    move_out_inspection_id: Optional[str] = None
    original_deposit: float = Field(ge=0.0)
    proposed_deductions: List[DeductionItem] = []


class SettlementUpdate(BaseModel):
    original_deposit: Optional[float] = None
    proposed_deductions: Optional[List[DeductionItem]] = None
    status: Optional[str] = Field(default=None, pattern="^(draft|agreed|disputed)$")


class SettlementResponse(BaseModel):
    id: str
    property_id: str
    move_in_inspection_id: str
    move_out_inspection_id: Optional[str] = None
    original_deposit: float
    proposed_deductions: List[Dict[str, Any]]
    total_deductions: float
    refund_amount: float
    status: str
    created_at: datetime
    updated_at: datetime
