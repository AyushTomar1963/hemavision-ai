"""Env-driven settings for HemaVision backend."""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="HEMAVISION_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "HemaVision"
    version: str = "2.1.0"
    log_level: str = "INFO"

    # Uploads
    max_upload_bytes: int = 12 * 1024 * 1024
    allowed_mime_prefixes: tuple[str, ...] = ("image/",)

    # ConvNeXt
    run_convnext: bool = False

    # CORS
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Auth
    auth_required: bool = False
    jwt_secret: str = "change-me-in-production-please"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24 h
    demo_user_email: str = "demo@hemavision.ai"
    demo_user_password: str = "demo1234"
    db_path: str = "hemavision.db"

    # Rate limiting
    rate_limit_analyze: str = "30/minute"
    rate_limit_auth: str = "10/minute"

    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
