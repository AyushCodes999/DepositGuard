"""
Test (Run 2): Model Fallback Test on 429 / RESOURCE_EXHAUSTED and 503 / UNAVAILABLE
Validates:
- GuardBot: Primary model (gemini-3.8-flash) immediately falls back on 429 without wasting retries.
- GuardBot: Primary model (gemini-3.8-flash) retries and, on 503/UNAVAILABLE, falls back to GEMINI_MODEL_FAST (gemini-3.5-flash-lite).
- Batched AI Comparison: Single batched call evaluates room items and falls back to GEMINI_MODEL_FAST on 429/503.
- Single Item Comparison: Fallback on 429 and 503.
"""

import asyncio
import json
from unittest.mock import MagicMock, patch
from app.services.ai_service import chat_with_guardbot, compare_item_conditions, batch_compare_item_conditions
from app.config import settings


def test_guardbot_429_immediate_fallback():
    """
    Validates that on 429 / RESOURCE_EXHAUSTED / quota errors, GuardBot
    immediately falls back to GEMINI_MODEL_FAST without retrying the reasoning model.
    """
    async def _run_test():
        mock_client = MagicMock()

        fallback_response = MagicMock()
        fallback_response.text = "Here is guidance under Model Tenancy Act rules."

        reasoning_call_count = 0

        def side_effect(model, contents, config):
            nonlocal reasoning_call_count
            if model == settings.GEMINI_MODEL_REASONING:
                reasoning_call_count += 1
                raise Exception("429 RESOURCE_EXHAUSTED: Generate content requests per day limit exceeded")
            elif model == settings.GEMINI_MODEL_FAST:
                return fallback_response
            raise ValueError(f"Unexpected model: {model}")

        mock_client.models.generate_content.side_effect = side_effect

        with patch("app.services.ai_service.call_groq_chat", return_value=None), \
             patch("app.services.ai_service.get_genai_client", return_value=mock_client):
            res = await chat_with_guardbot(
                user_id="test-429-fallback-user",
                message="What is the rule for wall repainting deductions?",
                history=[]
            )

            assert res["reply"] == "Here is guidance under Model Tenancy Act rules."
            assert res["model_used"] == settings.GEMINI_MODEL_FAST
            # Crucial: Must NOT waste retries on 429 - reasoning called exactly once!
            assert reasoning_call_count == 1

    asyncio.run(_run_test())


def test_guardbot_503_fallback():
    async def _run_test():
        mock_client = MagicMock()

        # Mock response from fallback model
        fallback_response = MagicMock()
        fallback_response.text = "Here is guidance under Model Tenancy Act rules."

        # Side effect function: fail on reasoning model, succeed on fallback fast model
        def side_effect(model, contents, config):
            if model == settings.GEMINI_MODEL_REASONING:
                raise Exception("503 Service Unavailable: Model is overloaded")
            elif model == settings.GEMINI_MODEL_FAST:
                return fallback_response
            raise ValueError(f"Unexpected model: {model}")

        mock_client.models.generate_content.side_effect = side_effect

        with patch("app.services.ai_service.call_groq_chat", return_value=None), \
             patch("app.services.ai_service.get_genai_client", return_value=mock_client):
            res = await chat_with_guardbot(
                user_id="test-fallback-user",
                message="What is the rule for wall repainting deductions?",
                history=[]
            )

            assert res["reply"] == "Here is guidance under Model Tenancy Act rules."
            assert res["model_used"] == settings.GEMINI_MODEL_FAST

    asyncio.run(_run_test())


def test_batch_compare_item_conditions_success():
    """
    Validates single batched Gemini call evaluating all room items together.
    """
    async def _run_test():
        mock_client = MagicMock()

        batched_json = {
            "evaluations": [
                {
                    "index": 0,
                    "change_type": "normal_wear",
                    "confidence": 0.85,
                    "rationale": "Minor scuff marks represent expected daily wear."
                },
                {
                    "index": 1,
                    "change_type": "possible_damage",
                    "confidence": 0.9,
                    "rationale": "Cracked basin bowl requires repair."
                }
            ]
        }
        mock_response = MagicMock()
        mock_response.text = json.dumps(batched_json)
        mock_client.models.generate_content.return_value = mock_response

        items = [
            {
                "index": 0,
                "item_id": "item-1",
                "item_name": "Living Room Walls",
                "room_name": "Living Area",
                "move_in_data": {"condition": "clean_functional", "notes": "Fresh paint"},
                "move_out_data": {"condition": "minor_wear", "notes": "Faint scuff near door"}
            },
            {
                "index": 1,
                "item_id": "item-2",
                "item_name": "Washbasin",
                "room_name": "Bathroom",
                "move_in_data": {"condition": "clean_functional", "notes": "Intact"},
                "move_out_data": {"condition": "damaged", "notes": "Hairline crack on rim"}
            }
        ]

        with patch("app.services.ai_service.call_groq_chat", return_value=None), \
             patch("app.services.ai_service.get_genai_client", return_value=mock_client):
            results, model_used = await batch_compare_item_conditions(items)

            # Single API call evaluated all items
            assert mock_client.models.generate_content.call_count == 1
            assert len(results) == 2
            assert results[0]["change_type"] == "normal_wear"
            assert results[1]["change_type"] == "possible_damage"
            assert results[0]["ai_status"] == "success"

    asyncio.run(_run_test())


def test_batch_compare_429_fallback():
    """
    Validates that batched comparison falls back immediately on 429 / quota.
    """
    async def _run_test():
        mock_client = MagicMock()

        batched_json = {
            "evaluations": [
                {
                    "index": 0,
                    "change_type": "normal_wear",
                    "confidence": 0.8,
                    "rationale": "Light dusting is normal wear."
                }
            ]
        }
        fallback_resp = MagicMock()
        fallback_resp.text = json.dumps(batched_json)

        reasoning_calls = 0

        def side_effect(model, contents, config):
            nonlocal reasoning_calls
            if model == settings.GEMINI_MODEL_REASONING:
                reasoning_calls += 1
                raise Exception("429 RESOURCE_EXHAUSTED")
            elif model == settings.GEMINI_MODEL_FAST:
                return fallback_resp
            raise ValueError(f"Unexpected model: {model}")

        mock_client.models.generate_content.side_effect = side_effect

        items = [
            {
                "index": 0,
                "item_id": "item-1",
                "item_name": "Ceiling Fan",
                "room_name": "Bedroom",
                "move_in_data": {"condition": "clean_functional", "notes": "Clean"},
                "move_out_data": {"condition": "minor_wear", "notes": "Dusty"}
            }
        ]

        with patch("app.services.ai_service.call_groq_chat", return_value=None), \
             patch("app.services.ai_service.get_genai_client", return_value=mock_client):
            results, model_used = await batch_compare_item_conditions(items)

            assert model_used == settings.GEMINI_MODEL_FAST
            assert reasoning_calls == 1  # No wasted retries
            assert len(results) == 1
            assert results[0]["change_type"] == "normal_wear"

    asyncio.run(_run_test())


def test_compare_item_conditions_503_fallback():
    mock_client = MagicMock()

    fallback_response = MagicMock()
    fallback_response.text = '{"change_type": "normal_wear", "confidence": 0.85, "rationale": "Minor scuff marks represent expected daily wear."}'

    def side_effect(model, contents, config):
        if model == settings.GEMINI_MODEL_REASONING:
            raise Exception("503 Service Unavailable: Model is overloaded")
        elif model == settings.GEMINI_MODEL_FAST:
            return fallback_response
        raise ValueError(f"Unexpected model: {model}")

    mock_client.models.generate_content.side_effect = side_effect

    with patch("app.services.ai_service.call_groq_chat", return_value=None), \
         patch("app.services.ai_service.get_genai_client", return_value=mock_client):
        res = compare_item_conditions(
            item_name="Living Room Walls",
            room_name="Living Area",
            move_in_data={"condition": "clean_functional", "notes": "Freshly painted"},
            move_out_data={"condition": "minor_wear", "notes": "Faint scuff near light switch"},
            photo_urls=[]
        )

        assert res["ai_status"] == "success"
        assert res["change_type"] == "normal_wear"
        assert res["confidence"] == 0.85
        assert res["model_used"] == settings.GEMINI_MODEL_FAST


def test_guardbot_groq_primary_success():
    """
    Validates that when GROQ_API_KEY is configured, GuardBot calls Groq FIRST
    and returns its reply with model_used == settings.GROQ_MODEL without invoking Gemini.
    """
    async def _run_test():
        mock_genai_client = MagicMock()
        with patch.object(settings, "GROQ_API_KEY", "gsk_test_groq_key_12345"), \
             patch("app.services.ai_service.call_groq_chat", return_value="Normal wear under MTA 2021.") as mock_groq, \
             patch("app.services.ai_service.get_genai_client", return_value=mock_genai_client):

            res = await chat_with_guardbot(
                user_id="test-groq-primary-user",
                message="Is tap washer replacement landlord responsibility?",
                history=[]
            )

            assert res["reply"] == "Normal wear under MTA 2021."
            assert res["model_used"] == settings.GROQ_MODEL
            assert mock_groq.call_count == 1
            # Gemini client should not even be fetched or called
            assert mock_genai_client.models.generate_content.call_count == 0

    asyncio.run(_run_test())


def test_guardbot_groq_failure_gemini_fallback():
    """
    Validates that when Groq fails (returns None or raises error),
    GuardBot seamlessly falls back to GEMINI_MODEL_REASONING.
    """
    async def _run_test():
        mock_gemini_resp = MagicMock()
        mock_gemini_resp.text = "Gemini reasoning advice under MTA 2021 principles."

        mock_genai_client = MagicMock()
        mock_genai_client.models.generate_content.return_value = mock_gemini_resp

        with patch.object(settings, "GROQ_API_KEY", "gsk_test_groq_key_12345"), \
             patch("app.services.ai_service.call_groq_chat", return_value=None), \
             patch("app.services.ai_service.get_genai_client", return_value=mock_genai_client):

            res = await chat_with_guardbot(
                user_id="test-groq-fallback-user",
                message="Can landlord deduct for minor scuffs on the wall?",
                history=[]
            )

            assert res["reply"] == "Gemini reasoning advice under MTA 2021 principles."
            assert res["model_used"] == settings.GEMINI_MODEL_REASONING
            assert mock_genai_client.models.generate_content.call_count == 1

    asyncio.run(_run_test())


def test_batch_compare_no_photos_groq_primary():
    """
    Validates that when no photos are attached, batch_compare_item_conditions
    calls Groq first and returns evaluations with model_used == settings.GROQ_MODEL.
    """
    async def _run_test():
        groq_json = {
            "evaluations": [
                {
                    "index": 0,
                    "change_type": "normal_wear",
                    "confidence": 0.9,
                    "rationale": "Minor dust on blades is expected wear."
                }
            ]
        }
        mock_genai_client = MagicMock()

        items = [
            {
                "index": 0,
                "item_id": "fan-1",
                "item_name": "Ceiling Fan",
                "room_name": "Master Bedroom",
                "move_in_data": {"condition": "clean_functional", "notes": "Clean"},
                "move_out_data": {"condition": "minor_wear", "notes": "Slight dust on fan blades"}
            }
        ]

        with patch.object(settings, "GROQ_API_KEY", "gsk_test_groq_key_12345"), \
             patch("app.services.ai_service.call_groq_chat", return_value=json.dumps(groq_json)) as mock_groq, \
             patch("app.services.ai_service.get_genai_client", return_value=mock_genai_client):

            results, model_used = await batch_compare_item_conditions(items)

            assert model_used == settings.GROQ_MODEL
            assert mock_groq.call_count == 1
            assert mock_genai_client.models.generate_content.call_count == 0
            assert len(results) == 1
            assert results[0]["change_type"] == "normal_wear"
            assert results[0]["ai_status"] == "success"

    asyncio.run(_run_test())


def test_batch_compare_photos_gemini_first_groq_fallback():
    """
    Validates that when photos are attached, Gemini is called first (for vision),
    and if both Gemini models fail with 503/429/timeout, falls back to Groq text-only note comparison.
    """
    async def _run_test():
        mock_genai_client = MagicMock()
        # Both reasoning and fast Gemini models fail with 503
        mock_genai_client.models.generate_content.side_effect = Exception("503 Service Unavailable: High load")

        groq_json = {
            "evaluations": [
                {
                    "index": 0,
                    "change_type": "possible_damage",
                    "confidence": 0.85,
                    "rationale": "Cracked tile noted in move-out notes represents chargeable damage."
                }
            ]
        }

        # Item with a mock base64 photo
        items = [
            {
                "index": 0,
                "item_id": "tile-1",
                "item_name": "Floor Tiles",
                "room_name": "Bathroom",
                "move_in_data": {"condition": "clean_functional", "notes": "No cracks"},
                "move_out_data": {"condition": "damaged", "notes": "Cracked ceramic tile near drain"},
                "photos": ["data:image/jpeg;base64,/9j/4AAQSkZJRg=="]
            }
        ]

        with patch.object(settings, "GROQ_API_KEY", "gsk_test_groq_key_12345"), \
             patch("app.services.ai_service.call_groq_chat", return_value=json.dumps(groq_json)) as mock_groq, \
             patch("app.services.ai_service.get_genai_client", return_value=mock_genai_client):

            results, model_used = await batch_compare_item_conditions(items)

            # Gemini vision was attempted first
            assert mock_genai_client.models.generate_content.call_count >= 1
            # Groq was used as fallback
            assert model_used == settings.GROQ_MODEL
            assert mock_groq.call_count == 1
            assert len(results) == 1
            assert results[0]["change_type"] == "possible_damage"
            assert results[0]["ai_status"] == "success"

    asyncio.run(_run_test())

