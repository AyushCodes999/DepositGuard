"""
GuardBot Chatbot Router
Endpoints:
- POST /api/guardbot/chat: Authenticated, rate-limited, pre-model validated chatbot.
- POST /api/guardbot/structure-note: Fast note-to-JSON structuring using gemini-3.5-flash-lite.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from app.models.schemas import (
    GuardBotChatRequest, GuardBotChatResponse, NoteStructureRequest, NoteStructureResponse
)
from app.database import ProfileModel
from app.middleware.auth import get_current_user
from app.services.ai_service import (
    chat_with_guardbot, structure_rough_note, structure_inspection_note, GuardBotError
)

logger = logging.getLogger("depositguard.guardbot")

router = APIRouter(prefix="/guardbot", tags=["guardbot"])


@router.post("/chat", response_model=GuardBotChatResponse)
async def chat_endpoint(
    req: GuardBotChatRequest,
    user: ProfileModel = Depends(get_current_user)
):
    """
    Authenticated, non-streaming GuardBot chat.
    Enforces:
    - Pre-model validation (length 2-1000, letters check, mash rejection)
    - History capped at 10 turns
    - Per-user rate limit (20 req/min)
    - 20s timeout with 1 retry on 429/503
    - Error codes: invalid_input, rate_limited, timeout, upstream_unavailable
    - Logs error code and latency, never message content
    """
    history_dicts = [{"role": m.role, "content": m.content} for m in req.history]

    try:
        result = await chat_with_guardbot(
            user_id=user.id,
            message=req.message,
            history=history_dicts
        )
        return GuardBotChatResponse(
            reply=result["reply"],
            latency_ms=result["latency_ms"],
            model_used=result["model_used"]
        )
    except GuardBotError as e:
        status_map = {
            "invalid_input": status.HTTP_400_BAD_REQUEST,
            "rate_limited": status.HTTP_429_TOO_MANY_REQUESTS,
            "timeout": status.HTTP_504_GATEWAY_TIMEOUT,
            "upstream_unavailable": status.HTTP_503_SERVICE_UNAVAILABLE
        }
        http_status = status_map.get(e.error_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        return JSONResponse(
            status_code=http_status,
            content={
                "error_code": e.error_code,
                "detail": e.detail,
                "retry_allowed": e.retry_allowed
            }
        )
    except Exception as e:
        logger.error(f"GuardBot unexpected error: {type(e).__name__}: {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error_code": "upstream_unavailable",
                "detail": "AI service temporarily unavailable. Please retry.",
                "retry_allowed": True
            }
        )


@router.post("/structure-note", response_model=NoteStructureResponse)
async def structure_note_endpoint(
    req: NoteStructureRequest,
    user: ProfileModel = Depends(get_current_user)
):
    """
    Fast note-to-JSON structuring using Groq primary / Gemini fallback.
    Retries once on invalid output; on second failure returns raw notes with ai_status='failed'.
    """
    result = await structure_inspection_note(rough_notes=req.rough_notes, item_name=req.item_name)
    return NoteStructureResponse(
        ai_status=result["ai_status"],
        data=result["data"],
        raw_notes=result["raw_notes"],
        model_used=result["model_used"]
    )
