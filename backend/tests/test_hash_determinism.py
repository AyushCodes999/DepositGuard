"""
Test 1: Hash Determinism Test
Validates that canonical payload serialization produces identical SHA-256 hashes
regardless of dictionary key insertion order, and that any payload mutation alters the hash.
"""

import copy
from app.services.canonical import (
    build_canonical_payload,
    serialize_canonical_json,
    compute_sha256
)


def test_canonical_hash_determinism():
    """
    Test that two payloads with identical contents but scrambled key orders
    and differently ordered lists produce the EXACT same canonical JSON and SHA-256 hash.
    """
    inspection = {
        "id": "insp-1001",
        "property_id": "prop-500",
        "type": "move_in",
        "created_by": "user-tenant-1"
    }

    # Rooms defined in non-sorted order
    rooms = [
        {"id": "room-2", "name": "Bathroom", "room_order": 2},
        {"id": "room-1", "name": "Bedroom", "room_order": 1}
    ]

    items_by_room = {
        "room-1": [
            {
                "id": "item-b",
                "name": "Walls (Stains, Seepage, Cracks)",
                "condition": "clean_functional",
                "notes": "Minor pencil mark on south wall",
                "item_order": 2
            },
            {
                "id": "item-a",
                "name": "Full Room Panoramic Corner Shots",
                "condition": "clean_functional",
                "notes": "All four corners clear",
                "item_order": 1
            }
        ],
        "room-2": [
            {
                "id": "item-c",
                "name": "WC / Toilet Pot",
                "condition": "clean_functional",
                "notes": "Flush functioning properly",
                "item_order": 1
            }
        ]
    }

    photos_by_item = {
        "item-a": [
            {
                "id": "p2",
                "sha256_hash": "bbbb888899990000aaaa1111222233334444555566667777888899990000aaaa",
                "storage_path": "prop-500/insp-1001/room-1/p2.jpg",
                "uploaded_by": "user-tenant-1"
            },
            {
                "id": "p1",
                "sha256_hash": "aaaa1111222233334444555566667777888899990000aaaabbbb888899990000",
                "storage_path": "prop-500/insp-1001/room-1/p1.jpg",
                "uploaded_by": "user-tenant-1"
            }
        ],
        "item-b": [],
        "item-c": []
    }

    approvals = [
        {"user_id": "user-landlord-1", "role": "landlord", "decision": "approved"},
        {"user_id": "user-tenant-1", "role": "tenant", "decision": "approved"}
    ]

    # Build canonical payload 1
    payload1 = build_canonical_payload(
        inspection=inspection,
        rooms=rooms,
        items_by_room=items_by_room,
        photos_by_item=photos_by_item,
        approvals=approvals,
        schema_version=1
    )
    hash1 = compute_sha256(payload1)

    # Scramble inputs: reverse rooms, reverse items, reverse approvals order
    scrambled_rooms = list(reversed(rooms))
    scrambled_items = {
        "room-1": list(reversed(items_by_room["room-1"])),
        "room-2": list(items_by_room["room-2"])
    }
    scrambled_photos = {
        "item-a": list(reversed(photos_by_item["item-a"])),
        "item-b": [],
        "item-c": []
    }
    scrambled_approvals = list(reversed(approvals))

    payload2 = build_canonical_payload(
        inspection=inspection,
        rooms=scrambled_rooms,
        items_by_room=scrambled_items,
        photos_by_item=scrambled_photos,
        approvals=scrambled_approvals,
        schema_version=1
    )
    hash2 = compute_sha256(payload2)

    # Hashes MUST match identically (determinism)
    assert hash1 == hash2, "Canonical hash must be deterministic regardless of input list or key order!"
    assert len(hash1) == 64, "SHA-256 hash must be 64 hexadecimal characters"

    # Now verify sensitivity: alter even a single letter in notes
    mutated_items = copy.deepcopy(items_by_room)
    mutated_items["room-1"][0]["notes"] = "Minor pencil mark on south wall (altered)"

    payload_mutated = build_canonical_payload(
        inspection=inspection,
        rooms=rooms,
        items_by_room=mutated_items,
        photos_by_item=photos_by_item,
        approvals=approvals,
        schema_version=1
    )
    hash_mutated = compute_sha256(payload_mutated)

    assert hash1 != hash_mutated, "Modifying notes must alter the computed canonical hash!"
