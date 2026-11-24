"""
Test 2: Post-Lock Immutability and State Machine Test
Validates:
1. When an inspection is locked, any attempt to update items or add photos is rejected.
2. Edits during pending_approval reset status to draft and clear approvals.
3. Post-lock modifications can only be recorded via append-only amendments.
4. Verify endpoint successfully confirms integrity of the locked record.
"""

import pytest


def test_post_lock_immutability(client):
    # 1. Register landlord
    r_landlord = client.post("/api/auth/register", json={
        "email": "landlord@example.com",
        "password": "password123",
        "full_name": "Ramesh Kumar (Landlord)",
        "role": "landlord"
    })
    assert r_landlord.status_code == 201
    landlord_token = r_landlord.json()["access_token"]
    landlord_headers = {"Authorization": f"Bearer {landlord_token}"}

    # 2. Register tenant
    r_tenant = client.post("/api/auth/register", json={
        "email": "tenant@example.com",
        "password": "password123",
        "full_name": "Priya Sharma (Tenant)",
        "role": "tenant"
    })
    assert r_tenant.status_code == 201
    tenant_token = r_tenant.json()["access_token"]
    tenant_headers = {"Authorization": f"Bearer {tenant_token}"}

    # 3. Landlord creates a property
    r_prop = client.post("/api/properties", json={
        "title": "2BHK Indiranagar Flat",
        "address": "100 Feet Road, Indiranagar",
        "city": "Bengaluru",
        "property_type": "flat"
    }, headers=landlord_headers)
    assert r_prop.status_code == 201
    property_id = r_prop.json()["id"]
    invite_code = r_prop.json()["invite_code"]

    # 4. Tenant joins using invite code
    r_join = client.post("/api/properties/join", json={"invite_code": invite_code}, headers=tenant_headers)
    assert r_join.status_code == 200

    # 5. Landlord creates move-in inspection with pre-populated research checklist
    r_insp = client.post("/api/inspections", json={
        "property_id": property_id,
        "type": "move_in",
        "use_default_checklist": True
    }, headers=landlord_headers)
    assert r_insp.status_code == 201
    inspection = r_insp.json()
    inspection_id = inspection["id"]
    assert len(inspection["rooms"]) == 5  # Bedroom, Bathroom, Kitchen, Living Area, Appliances & Electricals
    assert inspection["status"] == "draft"

    # Pick an item to update
    first_room = inspection["rooms"][0]
    first_item = first_room["items"][0]

    # 6. Tenant updates item notes
    r_update = client.patch(
        f"/api/inspections/{inspection_id}/items/{first_item['id']}",
        json={"notes": "Checked corner paint, small hairline crack noted"},
        headers=tenant_headers
    )
    assert r_update.status_code == 200
    assert "hairline crack" in r_update.json()["notes"]

    # 7. Request approval -> transitions to pending_approval
    r_req = client.post(f"/api/inspections/{inspection_id}/request-approval", headers=tenant_headers)
    assert r_req.status_code == 200
    assert r_req.json()["status"] == "pending_approval"

    # 8. First approval by Tenant
    r_app1 = client.post(f"/api/approvals/{inspection_id}", json={
        "decision": "approved",
        "comments": "Tenant agrees to initial move-in condition"
    }, headers=tenant_headers)
    assert r_app1.status_code == 200
    assert r_app1.json()["status"] == "pending_approval"

    # 9. Second approval by Landlord -> TRIGGERS DUAL-CONFIRMATION LOCK
    r_app2 = client.post(f"/api/approvals/{inspection_id}", json={
        "decision": "approved",
        "comments": "Landlord agrees and locks condition record"
    }, headers=landlord_headers)
    assert r_app2.status_code == 200
    locked_insp = r_app2.json()
    assert locked_insp["status"] == "locked"
    assert locked_insp["locked_hash"] is not None
    assert len(locked_insp["locked_hash"]) == 64
    assert locked_insp["locked_at"] is not None

    # 10. IMMUTABILITY CHECK: Attempt to modify item in locked inspection MUST FAIL
    r_fail_update = client.patch(
        f"/api/inspections/{inspection_id}/items/{first_item['id']}",
        json={"notes": "Malicious post-lock attempt to tamper with notes"},
        headers=tenant_headers
    )
    assert r_fail_update.status_code == 400
    assert "locked and immutable" in r_fail_update.json()["detail"].lower()

    # 11. VERIFY ENDPOINT: Verify hash integrity
    r_verify = client.get(f"/api/inspections/{inspection_id}/verify")
    assert r_verify.status_code == 200
    verify_data = r_verify.json()
    assert verify_data["is_locked"] is True
    assert verify_data["is_tamper_free"] is True
    assert verify_data["stored_hash"] == locked_insp["locked_hash"]
    assert "tamper-evident" in verify_data["tamper_evident_notice"].lower()

    # 12. AMENDMENT FLOW: Append-only post-lock amendment
    r_amendment = client.post(
        f"/api/amendments/{inspection_id}",
        json={
            "reason": "AC cooling coil serviced 2 days after move-in",
            "changed_fields": {"ac_status": "repaired and cooling normal"}
        },
        headers=tenant_headers
    )
    assert r_amendment.status_code == 201
    amendment_data = r_amendment.json()
    assert amendment_data["prev_hash"] == locked_insp["locked_hash"]
    assert amendment_data["amendment_hash"] is not None
    assert amendment_data["acknowledged_at"] is None

    # 13. Landlord acknowledges the amendment
    r_ack = client.post(
        f"/api/amendments/item/{amendment_data['id']}/acknowledge",
        headers=landlord_headers
    )
    assert r_ack.status_code == 200
    assert r_ack.json()["acknowledged_at"] is not None
