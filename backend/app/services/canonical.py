"""
Canonical Payload Serialization and SHA-256 Hashing Service
Guarantees deterministic, tamper-evident digital records for inspections and amendment chains.
"""

import hashlib
import json
from typing import Any, Dict, List


def serialize_canonical_json(payload: Dict[str, Any]) -> bytes:
    """
    Serializes a dictionary into canonical JSON:
    - Sorted keys
    - No superfluous whitespace (separators=(',', ':'))
    - Strict UTF-8 encoding
    - Consistent numeric/string representations
    """
    json_str = json.dumps(
        payload,
        sort_keys=True,
        separators=(',', ':'),
        ensure_ascii=False
    )
    return json_str.encode('utf-8')


def compute_sha256(data: bytes | str | Dict[str, Any]) -> str:
    """
    Computes a SHA-256 hexadecimal digest from raw bytes, text string, or a dict (via canonical json).
    """
    if isinstance(data, dict):
        raw_bytes = serialize_canonical_json(data)
    elif isinstance(data, str):
        raw_bytes = data.encode('utf-8')
    elif isinstance(data, (bytes, bytearray)):
        raw_bytes = bytes(data)
    else:
        raise ValueError(f"Unsupported data type for hashing: {type(data)}")

    return hashlib.sha256(raw_bytes).hexdigest()


def build_canonical_payload(
    inspection: Dict[str, Any],
    rooms: List[Dict[str, Any]],
    items_by_room: Dict[str, List[Dict[str, Any]]],
    photos_by_item: Dict[str, List[Dict[str, Any]]],
    approvals: List[Dict[str, Any]],
    schema_version: int = 1
) -> Dict[str, Any]:
    """
    Builds the canonical inspection payload structure for hashing.
    Enforces deterministic sorting across rooms, items, photos, and approver IDs.
    """
    sorted_approver_ids = sorted([
        str(a.get("user_id")) for a in approvals if a.get("decision") == "approved"
    ])

    formatted_rooms = []
    # Sort rooms deterministically by room_order and name
    sorted_rooms = sorted(rooms, key=lambda r: (r.get("room_order", 0), r.get("name", "")))

    for room in sorted_rooms:
        room_id = str(room.get("id", ""))
        raw_items = items_by_room.get(room_id, [])
        sorted_items = sorted(raw_items, key=lambda i: (i.get("item_order", 0), i.get("name", "")))

        formatted_items = []
        for item in sorted_items:
            item_id = str(item.get("id", ""))
            raw_photos = photos_by_item.get(item_id, [])
            sorted_photos = sorted(raw_photos, key=lambda p: p.get("sha256_hash", ""))

            formatted_photos = [
                {
                    "photo_id": str(p.get("id", "")),
                    "sha256_hash": str(p.get("sha256_hash", "")),
                    "storage_path": str(p.get("storage_path", "")),
                    "uploaded_by": str(p.get("uploaded_by", ""))
                }
                for p in sorted_photos
            ]

            formatted_items.append({
                "item_id": item_id,
                "name": str(item.get("name", "")).strip(),
                "condition": str(item.get("condition", "clean_functional")),
                "notes": str(item.get("notes", "")).strip(),
                "photos": formatted_photos
            })

        formatted_rooms.append({
            "room_id": room_id,
            "name": str(room.get("name", "")).strip(),
            "room_order": int(room.get("room_order", 0)),
            "items": formatted_items
        })

    canonical_dict = {
        "schema_version": schema_version,
        "inspection_id": str(inspection.get("id", "")),
        "property_id": str(inspection.get("property_id", "")),
        "type": str(inspection.get("type", "move_in")),
        "created_by": str(inspection.get("created_by", "")),
        "approver_ids": sorted_approver_ids,
        "rooms": formatted_rooms
    }

    return canonical_dict


def compute_amendment_hash(
    prev_hash: str,
    changed_fields: Dict[str, Any],
    author_id: str,
    reason: str,
    created_at_iso: str
) -> str:
    """
    Computes a cryptographic chain hash for an amendment:
    sha256(prev_hash + canonical_json(changed_fields) + author_id + reason + timestamp)
    """
    amendment_payload = {
        "prev_hash": prev_hash,
        "changed_fields": changed_fields,
        "author_id": str(author_id),
        "reason": reason.strip(),
        "created_at": created_at_iso
    }
    return compute_sha256(amendment_payload)
