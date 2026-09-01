"""Pydantic response schemas for HemaVision."""

from __future__ import annotations

from typing import List, Literal

from pydantic import BaseModel, EmailStr, Field


class Health(BaseModel):
    ok: bool
    model_loaded: bool
    version: str


class WhoClass(BaseModel):
    sex: Literal["female", "male", "unspecified"]
    anemia: bool
    cutoff_g_dL: float
    severity: Literal["none", "mild", "moderate", "severe"]


class Quality(BaseModel):
    score: float
    grade: Literal["good", "acceptable", "poor"]
    flags: List[str]
    glare_pct: float
    mean_luminance: float
    roi_px: int


class Metrics(BaseModel):
    cielab_a_star: float
    cielab_L: float
    cielab_b_star: float
    erythema_index: float
    opencv_a_channel: float


class ModelInfo(BaseModel):
    backbone: str
    loaded: bool
    forward_pass: bool
    clinical_source: str


class AnalyzeResult(BaseModel):
    scan_id: str
    captured_at: str
    hemoglobin_g_dL: float
    uncertainty_g_dL: float
    status: str
    who: WhoClass
    quality: Quality
    metrics: Metrics
    pipeline: List[str]
    model: ModelInfo


class ErrorEnvelope(BaseModel):
    detail: str
    request_id: str


# Auth ---------------------------------------------------------------


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int
    email: EmailStr


class UserPublic(BaseModel):
    email: EmailStr
    created_at: str
