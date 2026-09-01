"""HemaVision FastAPI entry point.

Run with:  uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from analyze import router as analyze_router
from auth import router as auth_router
from config import get_settings
from db import ensure_demo_user, init_db
from logging_setup import configure_logging, get_logger, request_id_var
from meta import router as meta_router
from model import load_model
from rate_limit import limiter
from security import hash_password

settings = get_settings()
configure_logging(settings.log_level)
logger = get_logger("hemavision.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "startup version=%s auth_required=%s convnext=%s cors=%s",
        settings.version,
        settings.auth_required,
        settings.run_convnext,
        settings.cors_origins_list(),
    )
    init_db(settings.db_path)
    ensure_demo_user(
        settings.db_path,
        settings.demo_user_email,
        hash_password(settings.demo_user_password),
    )
    app.state.convnext = load_model() if settings.run_convnext else None
    try:
        yield
    finally:
        logger.info("shutdown")


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="Palpebral conjunctiva haemoglobin screening — not a CBC.",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list(),
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    rid = request.headers.get("x-request-id") or uuid.uuid4().hex[:12]
    token = request_id_var.set(rid)
    try:
        response = await call_next(request)
    finally:
        request_id_var.reset(token)
    response.headers["x-request-id"] = rid
    return response


def _error_response(status_code: int, detail: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"detail": detail, "request_id": request_id_var.get() or "-"},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_: Request, exc: StarletteHTTPException):
    return _error_response(exc.status_code, str(exc.detail))


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    return _error_response(422, f"Validation error: {exc.errors()}")


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    logger.exception("unhandled_exception %s", exc)
    return _error_response(500, "Internal server error.")


app.include_router(meta_router)
app.include_router(auth_router)
app.include_router(analyze_router)
