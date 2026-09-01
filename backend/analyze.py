"""Analyze router — decodes an image and returns the chromophore + triage sheet."""

from __future__ import annotations

import io
import uuid
from datetime import datetime, timezone
from typing import Optional

import cv2
import filetype
import numpy as np
import torch
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from PIL import Image, UnidentifiedImageError

from auth import require_user
from clinical import estimate_hemoglobin, triage_status, uncertainty, who_class
from config import Settings, get_settings
from logging_setup import get_logger
from model import tensor_from_bgr
from pipeline import decode_image, extract_chromophores, quality_report
from rate_limit import ANALYZE_LIMIT, limiter
from schemas import AnalyzeResult, Metrics, ModelInfo, Quality, WhoClass

router = APIRouter(tags=["analyze"])
logger = get_logger("hemavision.analyze")

_SEX_KEYS = {"female", "male", "unspecified"}


def _decode_bgr(contents: bytes) -> np.ndarray:
    img = decode_image(contents)
    if img is not None:
        return img
    try:
        pil = Image.open(io.BytesIO(contents)).convert("RGB")
        return cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not decode image: {exc}",
        ) from exc


def _validate_upload(contents: bytes, content_type: Optional[str], settings: Settings) -> None:
    if not contents:
        raise HTTPException(status_code=400, detail="Empty upload.")
    if len(contents) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail=(
                f"Image is {len(contents) // 1024} KB; "
                f"max {settings.max_upload_bytes // 1024} KB."
            ),
        )

    # Real-bytes sniffing: don't trust the client's content-type.
    kind = filetype.guess(contents)
    sniffed = kind.mime if kind else None
    header_ok = (
        content_type is not None
        and any(content_type.startswith(pfx) for pfx in settings.allowed_mime_prefixes)
    )
    bytes_ok = sniffed is not None and any(
        sniffed.startswith(pfx) for pfx in settings.allowed_mime_prefixes
    )
    if not (header_ok or bytes_ok):
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type (header={content_type}, bytes={sniffed}).",
        )


def _run_convnext(model, restored_bgr: np.ndarray) -> bool:
    if model is None:
        return False
    try:
        with torch.no_grad():
            _ = model(tensor_from_bgr(restored_bgr))
        return True
    except (RuntimeError, ValueError) as exc:
        logger.warning("convnext_skip reason=%s", exc)
        return False


@router.post("/analyze", response_model=AnalyzeResult)
@limiter.limit(ANALYZE_LIMIT)
async def analyze_conjunctiva(
    request: Request,
    file: UploadFile = File(...),
    sex: str = Form("unspecified"),
    settings: Settings = Depends(get_settings),
    _user=Depends(require_user),
) -> AnalyzeResult:
    contents = await file.read()
    _validate_upload(contents, file.content_type, settings)

    sex_key = (sex or "unspecified").strip().lower()
    if sex_key not in _SEX_KEYS:
        sex_key = "unspecified"

    img = _decode_bgr(contents)
    if img.shape[0] < 16 or img.shape[1] < 16:
        raise HTTPException(status_code=400, detail="Image is too small to analyse.")

    try:
        sample = extract_chromophores(img)
    except cv2.error as exc:
        raise HTTPException(status_code=422, detail=f"OpenCV pipeline failed: {exc}") from exc

    quality = quality_report(sample)
    hb = estimate_hemoglobin(sample.a_star, sample.erythema_index)

    model = getattr(request.app.state, "convnext", None)
    convnext_ran = _run_convnext(model, sample.restored_bgr)

    who = who_class(hb, sex_key)
    scan_id = f"hv_{uuid.uuid4().hex[:10]}"
    logger.info(
        "analyze scan_id=%s hb=%.2f sex=%s quality=%s bytes=%d",
        scan_id,
        hb,
        sex_key,
        quality["grade"],
        len(contents),
    )
    return AnalyzeResult(
        scan_id=scan_id,
        captured_at=datetime.now(timezone.utc).isoformat(),
        hemoglobin_g_dL=round(hb, 2),
        uncertainty_g_dL=uncertainty(quality["score"]),
        status=triage_status(hb, sex_key),
        who=WhoClass(**who),
        quality=Quality(**quality),
        metrics=Metrics(
            cielab_a_star=round(sample.a_star, 2),
            cielab_L=round(sample.L_star, 2),
            cielab_b_star=round(sample.b_star, 2),
            erythema_index=round(sample.erythema_index, 2),
            opencv_a_channel=round(sample.opencv_a, 2),
        ),
        pipeline=[
            "center-crop reticle",
            "glare mask + Telea inpaint",
            "vascular high-pass",
            "CIELAB a*/L*/b*",
            "erythema index",
            "chromophore Hb",
        ],
        model=ModelInfo(
            backbone="convnext_tiny",
            loaded=model is not None,
            forward_pass=convnext_ran,
            clinical_source="chromophore linear map (a*, EI)",
        ),
    )
