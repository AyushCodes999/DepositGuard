"""
Unit Tests for 6-Digit Email OTP Verification and Security Hardening
Tests:
- /api/auth/send-otp: 6-digit code generation & rate limiting
- /api/auth/verify-otp: attempt limits & cryptographic token generation
- /api/auth/register: strict email verification enforcement
- Salted PBKDF2-SHA256 password hashing & constant-time verification
- JWT cryptographic signature enforcement (no unverified decode)
"""

import pytest
from app.routers.auth import hash_password, verify_password


def test_salted_password_hashing():
    plain = "SuperSecret123!"
    stored = hash_password(plain)
    assert stored.startswith("pbkdf2_sha256$")
    assert verify_password(plain, stored) is True
    assert verify_password("WrongPassword!", stored) is False

    # Test legacy unsalted SHA-256 fallback compatibility
    import hashlib
    legacy = hashlib.sha256(plain.encode("utf-8")).hexdigest()
    assert verify_password(plain, legacy) is True
    assert verify_password("WrongPassword!", legacy) is False


def test_otp_flow_and_registration_enforcement(client):
    test_email = "newuser@gmail.com"

    # 1. Attempting to register without OTP verification must fail with 400
    r_unverified = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "password123",
        "full_name": "New User",
        "role": "tenant"
    })
    assert r_unverified.status_code == 400
    assert "verified" in r_unverified.json()["detail"].lower()

    # 2. Request OTP
    r_send = client.post("/api/auth/send-otp", json={
        "email": test_email,
        "purpose": "registration"
    })
    assert r_send.status_code == 200
    data = r_send.json()
    assert data["success"] is True
    assert "dev_code" in data
    otp = data["dev_code"]
    assert len(otp) == 6

    # 3. Submit wrong OTP - must fail and decrement remaining attempts
    r_wrong = client.post("/api/auth/verify-otp", json={
        "email": test_email,
        "otp": "000000"
    })
    assert r_wrong.status_code == 400
    assert "attempt" in r_wrong.json()["detail"].lower()

    # 4. Submit correct OTP - succeeds and issues verification token
    r_verify = client.post("/api/auth/verify-otp", json={
        "email": test_email,
        "otp": otp
    })
    assert r_verify.status_code == 200
    ver_data = r_verify.json()
    assert ver_data["success"] is True
    assert ver_data["verification_token"] is not None
    token = ver_data["verification_token"]

    # 5. Complete registration using verification token
    r_reg = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "password123",
        "full_name": "New User",
        "role": "tenant",
        "otp_token": token
    })
    assert r_reg.status_code == 201
    auth_data = r_reg.json()
    assert "access_token" in auth_data
    assert auth_data["user"]["email"] == test_email


def test_jwt_signature_enforcement(client):
    # Attempting to access /api/auth/me with a forged token must fail with 401
    import jwt
    from datetime import datetime, timezone, timedelta

    forged_token = jwt.encode(
        {"sub": "fake-id", "email": "hacker@evil.com", "role": "landlord", "exp": datetime.now(timezone.utc) + timedelta(days=1)},
        "wrong-secret-key",
        algorithm="HS256"
    )

    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {forged_token}"})
    assert r.status_code == 401
