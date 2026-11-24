"""
DepositGuard Database Layer (SQLAlchemy ORM + SQLite/PostgreSQL Support)
Provides local testing & production Supabase PostgreSQL compatibility.
Run 2 Update: Includes AIComparisonModel and SettlementModel relationships.
"""

from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    create_engine, Column, String, Integer, Float, DateTime, Boolean, ForeignKey, Text, JSON, text
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from app.config import settings

# If using PostgreSQL with Supabase, ensure connect_args suitable for postgres and PgBouncer pooler
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
    engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
else:
    # PostgreSQL (Supabase / Render)
    # Ensure sslmode=require and disable prepared statements for PgBouncer / Transaction Pooler
    pg_connect_args = {
        "sslmode": "require",
        "prepare_threshold": 0
    }
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=pg_connect_args,
        pool_pre_ping=True,
        pool_recycle=300
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def utcnow():
    return datetime.now(timezone.utc)


class ProfileModel(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)  # Salted PBKDF2-SHA256
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    role = Column(String, nullable=False)  # 'tenant' or 'landlord'
    email_verified = Column(Boolean, default=False, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)


class EmailOtpModel(Base):
    __tablename__ = "email_otps"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, nullable=False, index=True)
    otp_hash = Column(String, nullable=False)
    purpose = Column(String, default="registration", nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    verified = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)


class PropertyModel(Base):
    __tablename__ = "properties"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    landlord_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    title = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    property_type = Column(String, default="flat", nullable=False)
    invite_code = Column(String, unique=True, nullable=False, index=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    members = relationship("PropertyMemberModel", back_populates="property", cascade="all, delete-orphan")
    inspections = relationship("InspectionModel", back_populates="property", cascade="all, delete-orphan")
    settlements = relationship("SettlementModel", back_populates="property", cascade="all, delete-orphan")


class PropertyMemberModel(Base):
    __tablename__ = "property_members"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, ForeignKey("properties.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("profiles.id"), nullable=False, index=True)
    role = Column(String, nullable=False)  # 'tenant' or 'landlord'
    joined_at = Column(DateTime, default=utcnow, nullable=False)

    property = relationship("PropertyModel", back_populates="members")
    user = relationship("ProfileModel")


class InspectionModel(Base):
    __tablename__ = "inspections"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, ForeignKey("properties.id"), nullable=False, index=True)
    type = Column(String, default="move_in", nullable=False)  # move_in, move_out
    status = Column(String, default="draft", nullable=False)  # draft, pending_approval, locked, disputed
    dispute_reason = Column(Text, nullable=True)
    schema_version = Column(Integer, default=1, nullable=False)
    locked_hash = Column(String, nullable=True)
    locked_at = Column(DateTime, nullable=True)
    created_by = Column(String, ForeignKey("profiles.id"), nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    property = relationship("PropertyModel", back_populates="inspections")
    rooms = relationship("RoomModel", back_populates="inspection", cascade="all, delete-orphan", order_by="RoomModel.room_order")
    approvals = relationship("ApprovalModel", back_populates="inspection", cascade="all, delete-orphan")
    amendments = relationship("AmendmentModel", back_populates="inspection", cascade="all, delete-orphan", order_by="AmendmentModel.created_at")
    comparisons = relationship("AIComparisonModel", back_populates="inspection", cascade="all, delete-orphan")


class RoomModel(Base):
    __tablename__ = "rooms"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    room_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    inspection = relationship("InspectionModel", back_populates="rooms")
    items = relationship("RoomItemModel", back_populates="room", cascade="all, delete-orphan", order_by="RoomItemModel.item_order")


class RoomItemModel(Base):
    __tablename__ = "room_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    room_id = Column(String, ForeignKey("rooms.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    condition = Column(String, default="clean_functional", nullable=False)
    notes = Column(Text, default="", nullable=False)
    item_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    room = relationship("RoomModel", back_populates="items")
    photos = relationship("PhotoModel", back_populates="item", cascade="all, delete-orphan")


class PhotoModel(Base):
    __tablename__ = "photos"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False, index=True)
    room_id = Column(String, ForeignKey("rooms.id"), nullable=True, index=True)
    item_id = Column(String, ForeignKey("room_items.id"), nullable=True, index=True)
    storage_path = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=False)
    sha256_hash = Column(String, nullable=False)
    uploaded_by = Column(String, ForeignKey("profiles.id"), nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    item = relationship("RoomItemModel", back_populates="photos")


class ApprovalModel(Base):
    __tablename__ = "approvals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("profiles.id"), nullable=False, index=True)
    role = Column(String, nullable=False)  # 'tenant' or 'landlord'
    decision = Column(String, nullable=False)  # 'approved' or 'rejected'
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    inspection = relationship("InspectionModel", back_populates="approvals")


class AmendmentModel(Base):
    __tablename__ = "amendments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False, index=True)
    author_id = Column(String, ForeignKey("profiles.id"), nullable=False)
    author_role = Column(String, nullable=False)
    reason = Column(Text, nullable=False)
    changed_fields = Column(JSON, nullable=False)
    prev_hash = Column(String, nullable=False)
    amendment_hash = Column(String, nullable=False)
    acknowledged_by = Column(String, ForeignKey("profiles.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    inspection = relationship("InspectionModel", back_populates="amendments")


class SettlementModel(Base):
    __tablename__ = "settlements"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    property_id = Column(String, ForeignKey("properties.id"), nullable=False, index=True)
    move_in_inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False, index=True)
    move_out_inspection_id = Column(String, ForeignKey("inspections.id"), nullable=True, index=True)
    original_deposit = Column(Float, default=0.0, nullable=False)
    proposed_deductions = Column(JSON, default=list, nullable=False)
    total_deductions = Column(Float, default=0.0, nullable=False)
    refund_amount = Column(Float, default=0.0, nullable=False)
    status = Column(String, default="draft", nullable=False)  # draft, agreed, disputed
    created_at = Column(DateTime, default=utcnow, nullable=False)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    property = relationship("PropertyModel", back_populates="settlements")


class AIComparisonModel(Base):
    __tablename__ = "ai_comparisons"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False, index=True)
    move_in_item_id = Column(String, nullable=True)
    move_out_item_id = Column(String, nullable=True)
    item_name = Column(String, nullable=False)
    room_name = Column(String, nullable=False)
    change_type = Column(String, default="unclear", nullable=False)  # none, normal_wear, possible_damage, unclear
    confidence = Column(Float, default=0.0, nullable=False)
    rationale = Column(Text, default="", nullable=False)
    ai_status = Column(String, default="success", nullable=False)  # success, failed
    model_used = Column(String, default="gemini-3.8-flash", nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False)

    inspection = relationship("InspectionModel", back_populates="comparisons")


def init_db():
    Base.metadata.create_all(bind=engine)
    # Safe SQLite column migration for existing database files
    with engine.connect() as conn:
        try:
            result = conn.execute(text("PRAGMA table_info(profiles)")).fetchall()
            col_names = [row[1] for row in result]
            if "email_verified" not in col_names:
                conn.execute(text("ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT 0"))
                conn.commit()
        except Exception:
            pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
