"""Auth router: signup, login, me."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer

from config import Settings, get_settings
from db import create_user, get_user_by_email
from logging_setup import get_logger
from rate_limit import AUTH_LIMIT, limiter
from schemas import LoginRequest, SignupRequest, TokenResponse, UserPublic
from security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])
logger = get_logger("hemavision.auth")

# auto_error=False so /analyze can decide whether auth is required at runtime.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def _issue_token(email: str, settings: Settings) -> TokenResponse:
    token, ttl = create_access_token(
        subject=email,
        secret=settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
        expire_minutes=settings.jwt_expire_minutes,
    )
    return TokenResponse(access_token=token, expires_in=ttl, email=email)


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    settings: Settings = Depends(get_settings),
) -> Optional[dict]:
    if not token:
        return None
    try:
        payload = decode_token(token, settings.jwt_secret, settings.jwt_algorithm)
    except ValueError:
        return None
    email = payload.get("sub")
    if not email:
        return None
    return get_user_by_email(settings.db_path, email)


def require_user(
    request: Request,
    settings: Settings = Depends(get_settings),
    user: Optional[dict] = Depends(get_current_user_optional),
) -> Optional[dict]:
    if not settings.auth_required:
        return user
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(AUTH_LIMIT)
def signup(
    request: Request,
    payload: SignupRequest,
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    try:
        create_user(settings.db_path, payload.email, hash_password(payload.password))
    except ValueError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")
    logger.info("signup email=%s", payload.email)
    return _issue_token(payload.email.lower(), settings)


@router.post("/login", response_model=TokenResponse)
@limiter.limit(AUTH_LIMIT)
def login(
    request: Request,
    payload: LoginRequest,
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    user = get_user_by_email(settings.db_path, payload.email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")
    logger.info("login email=%s", payload.email)
    return _issue_token(user["email"], settings)


@router.get("/me", response_model=UserPublic)
def me(user: Optional[dict] = Depends(get_current_user_optional)) -> UserPublic:
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    return UserPublic(email=user["email"], created_at=user["created_at"])
