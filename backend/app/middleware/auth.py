"""
Auth Middleware and Authorization Dependencies
Decodes Supabase JWT tokens, resolves profile, and enforces property membership.
"""

from typing import Optional
from datetime import datetime, timezone, timedelta
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db, ProfileModel, PropertyMemberModel

security = HTTPBearer(auto_error=False)


def create_access_token(user_id: str, email: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT for local authentication & testing."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=7)

    to_encode = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "aud": "authenticated"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SUPABASE_JWT_SECRET, algorithm="HS256")
    return encoded_jwt


def decode_token(token: str) -> dict:
    """Cryptographically decodes and verifies signature of JWT tokens."""
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> ProfileModel:
    """
    Validates token and returns authenticated user's profile.
    Never trusts client-supplied role metadata.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials missing.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token subject missing."
        )

    user = db.query(ProfileModel).filter(ProfileModel.id == user_id).first()
    if not user:
        # Auto-provision profile from token claims if Supabase Auth user exists
        user = ProfileModel(
            id=user_id,
            email=payload.get("email", f"{user_id}@example.com"),
            full_name=payload.get("user_metadata", {}).get("full_name") or payload.get("email", "").split("@")[0],
            role=payload.get("role", "tenant")
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


def require_property_member(
    property_id: str,
    user: ProfileModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PropertyMemberModel:
    """
    Authorizes by property membership.
    Ensures user belongs to this specific property before allowing access.
    """
    member = db.query(PropertyMemberModel).filter(
        PropertyMemberModel.property_id == property_id,
        PropertyMemberModel.user_id == user.id
    ).first()

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You are not a registered member of this property."
        )
    return member
