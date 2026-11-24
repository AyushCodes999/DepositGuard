"""
DepositGuard FastAPI Application
tamper-evident, not tamper-proof | documentation, not legal advice
Run 2: Full AI Integration, GuardBot, Before/After Comparison, Settlements, and PDF Export.
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.services.ai_service import check_models_availability
from app.routers import (
    auth, properties, inspections, photos, approvals, amendments, verify,
    guardbot, comparison, settlements
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database tables and check GenAI availability non-blocking in background
    init_db()
    asyncio.create_task(asyncio.to_thread(check_models_availability))
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="DepositGuard: Tamper-evident rental deposit protection and inspection platform.",
    lifespan=lifespan
)

# Configure CORS for local development and production hosts (Vercel/Render)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(auth.router, prefix="/api")
app.include_router(properties.router, prefix="/api")
app.include_router(inspections.router, prefix="/api")
app.include_router(photos.router, prefix="/api")
app.include_router(approvals.router, prefix="/api")
app.include_router(amendments.router, prefix="/api")
app.include_router(verify.router, prefix="/api")

# Run 2 Routers
app.include_router(guardbot.router, prefix="/api")
app.include_router(comparison.router, prefix="/api")
app.include_router(settlements.router, prefix="/api")


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "features": {
            "dual_confirmation_lock": "active",
            "guardbot_ai": "active",
            "model_reasoning": settings.GEMINI_MODEL_REASONING,
            "model_fast": settings.GEMINI_MODEL_FAST,
            "before_after_comparison": "active",
            "pdf_export": "active"
        },
        "notice": "tamper-evident, not tamper-proof; documentation, not legal advice"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
