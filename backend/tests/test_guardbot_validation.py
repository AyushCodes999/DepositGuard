"""
Test 1 (Run 2): GuardBot Input Validation & Rate Limiting Test
Validates:
- Pre-model validation (length 2-1000, must contain letters, reject repeated-character/mash input)
- Specific error codes returned without making model API calls
- Per-user rate limiting (max 20 req/min)
"""

import pytest
from app.services.ai_service import validate_guardbot_input, GuardBotError, check_rate_limit


def test_guardbot_input_validation():
    # 1. Test empty or whitespace input
    with pytest.raises(GuardBotError) as exc_info:
        validate_guardbot_input("   ")
    assert exc_info.value.error_code == "invalid_input"

    # 2. Test length < 2
    with pytest.raises(GuardBotError) as exc_info:
        validate_guardbot_input("a")
    assert exc_info.value.error_code == "invalid_input"

    # 3. Test length > 1000
    with pytest.raises(GuardBotError) as exc_info:
        validate_guardbot_input("a" * 1001)
    assert exc_info.value.error_code == "invalid_input"

    # 4. Test input with no letters
    with pytest.raises(GuardBotError) as exc_info:
        validate_guardbot_input("1234567890 !@#$%^&*")
    assert exc_info.value.error_code == "invalid_input"
    assert "letters" in exc_info.value.detail.lower()

    # 5. Test repeated character mash
    with pytest.raises(GuardBotError) as exc_info:
        validate_guardbot_input("Helloooooooo")
    assert exc_info.value.error_code == "invalid_input"
    assert "repeated characters" in exc_info.value.detail.lower()

    # 6. Test keyboard mash pattern
    with pytest.raises(GuardBotError) as exc_info:
        validate_guardbot_input("asdfghjkl asdfghjkl")
    assert exc_info.value.error_code == "invalid_input"
    assert "keyboard mash" in exc_info.value.detail.lower()

    # 7. Valid questions should pass cleanly
    valid_q1 = "Is faded wall paint considered normal wear and tear under MTA 2021?"
    assert validate_guardbot_input(valid_q1) == valid_q1

    valid_hindi = "क्या पंखे की धूल नॉर्मल वियर एंड टियर में आती है?"
    assert validate_guardbot_input(valid_hindi) == valid_hindi


def test_guardbot_rate_limiting():
    user_id = "test-rate-limit-user-123"

    # First 20 requests should pass
    for _ in range(20):
        check_rate_limit(user_id)

    # 21st request in same minute must raise rate_limited
    with pytest.raises(GuardBotError) as exc_info:
        check_rate_limit(user_id)
    assert exc_info.value.error_code == "rate_limited"
    assert "rate limit exceeded" in exc_info.value.detail.lower()
