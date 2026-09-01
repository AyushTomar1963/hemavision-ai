"""Read-only informational endpoints: /, /health, /papers, /features."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from catalog import FEATURES, PAPERS
from config import Settings, get_settings
from schemas import Health

router = APIRouter(tags=["meta"])


@router.get("/")
def root(settings: Settings = Depends(get_settings)) -> dict:
    return {
        "service": settings.app_name,
        "version": settings.version,
        "routes": [
            "/analyze",
            "/health",
            "/papers",
            "/features",
            "/auth/signup",
            "/auth/login",
            "/auth/me",
        ],
    }


@router.get("/health", response_model=Health)
def health(request: Request, settings: Settings = Depends(get_settings)) -> Health:
    return Health(
        ok=True,
        model_loaded=getattr(request.app.state, "convnext", None) is not None,
        version=settings.version,
    )


@router.get("/papers")
def papers() -> dict:
    return {"papers": PAPERS}


@router.get("/features")
def features() -> dict:
    return {"features": FEATURES}
