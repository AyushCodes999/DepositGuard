"""
Test 2 (Run 2): Structured Output Retry & Fallback Test
Validates:
- Structured output retry logic when invalid output or exceptions occur.
- On second failure, returns raw note with ai_status="failed".
- Guarantees user input is preserved safely without data loss.
"""

from unittest.mock import MagicMock, patch
from app.services.ai_service import structure_rough_note


def test_structured_output_success():
    """Test successful JSON parsing on first attempt."""
    mock_response = MagicMock()
    mock_response.text = '{"condition": "minor_wear", "clean_notes": "Slight paint fading on living room wall", "tags": ["walls", "paint"]}'

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    with patch("app.services.ai_service.call_groq_chat", return_value=None), \
         patch("app.services.ai_service.get_genai_client", return_value=mock_client):
        res = structure_rough_note("wall paint looks a bit dull near the window", item_name="Living Area Walls")
        assert res["ai_status"] == "success"
        assert res["data"]["condition"] == "minor_wear"
        assert "fading" in res["data"]["clean_notes"].lower()
        assert "walls" in res["data"]["tags"]


def test_structured_output_retry_and_fallback():
    """
    Test that when model produces malformed output or fails twice:
    1. Retries once.
    2. On second failure, safely returns raw notes with ai_status='failed'.
    """
    mock_client = MagicMock()
    # First attempt raises error, second attempt raises error
    mock_client.models.generate_content.side_effect = [
        Exception("Malformed JSON string from upstream API"),
        Exception("Second failure timeout")
    ]

    with patch("app.services.ai_service.call_groq_chat", return_value=None), \
         patch("app.services.ai_service.get_genai_client", return_value=mock_client):
        rough = "geyser knob loose, water warm but indicator flickering"
        res = structure_rough_note(rough, item_name="Geyser")

        # Must have attempted twice (initial + 1 retry)
        assert mock_client.models.generate_content.call_count == 2
        # Must return ai_status="failed" with raw notes preserved
        assert res["ai_status"] == "failed"
        assert res["data"] is None
        assert res["raw_notes"] == rough
