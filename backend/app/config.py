"""
DepositGuard Configuration
Loads environment variables for Supabase, CORS, and Run 2 placeholders.
"""

import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"
_ROOT_ENV = _BACKEND_DIR.parent / ".env"


class Settings(BaseSettings):
    # App
    APP_NAME: str = "DepositGuard"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Supabase & Database
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = "depositguard-secret-dev-key-change-in-production-min32bytes"
    DATABASE_URL: str = "sqlite:///./depositguard.db"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"

    # Groq Settings (Optional Tier 1 Text AI Provider)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-20b"

    # Reserved for Run 2 (Do not alter or substitute model IDs):
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL_REASONING: str = "gemini-3.8-flash"
    GEMINI_MODEL_FAST: str = "gemini-3.5-flash-lite"

    model_config = SettingsConfigDict(
        env_file=(str(_ENV_FILE), str(_ROOT_ENV), ".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip().rstrip("/") for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
