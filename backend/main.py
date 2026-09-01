import io
import os
import uuid
from datetime import datetime, timezone

import cv2
import numpy as np
import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from catalog import FEATURES, PAPERS
from clinical import estimate_hemoglobin, triage_status, uncertainty, who_class
from model import load_model, tensor_from_bgr
from pipeline import decode_image, extract_chromophores, quality_report

MAX_UPLOAD_BYTES = 12 * 1024 * 1024  # 12 MB — plenty for a 1080p JPEG.
ALLOWED_MIME_PREFIXES = ("image/",)
RUN_CONVNEXT = os.getenv("HEMAVISION_RUN_CONVNEXT", "0") == "1"

app = FastAPI(
    title="HemaVision",
    version="2.0.1",
    description="Palpebral conjunctiva haemoglobin screening — not a CBC.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

model = load_model() if RUN_CONVNEXT else None


def bgr_from_upload(contents: bytes) -> np.ndarray:
    img = decode_image(contents)
    if img is not None:
        return img
    try:
        pil = Image.open(io.BytesIO(contents)).convert("RGB")
        return cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise HTTPException(status_code=400, detail=f"Could not decode image: {exc}") from exc


@app.get("/")
async def root():
    return {
        "service": "HemaVision",
        "version": "2.0.1",
        "routes": ["/analyze", "/health", "/papers", "/features"],
    }


@app.get("/health")
async def health():
    return {"ok": True, "model_loaded": model is not None, "version": "2.0.1"}


@app.get("/papers")
async def papers():
    return {"papers": PAPERS}


@app.get("/features")
async def features():
    return {"features": FEATURES}


@app.post("/analyze")
async def analyze_conjunctiva(
    file: UploadFile = File(...),
    sex: str = Form("unspecified"),
):
    if file.content_type and not file.content_type.startswith(ALLOWED_MIME_PREFIXES):
        raise HTTPException(status_code=415, detail=f"Unsupported media type: {file.content_type}")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty upload")
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image is {len(contents) // 1024} KB; max {MAX_UPLOAD_BYTES // 1024} KB.",
        )

    sex_key = (sex or "unspecified").strip().lower()
    if sex_key not in {"female", "male", "unspecified"}:
        sex_key = "unspecified"

    img = bgr_from_upload(contents)
    if img.shape[0] < 16 or img.shape[1] < 16:
        raise HTTPException(status_code=400, detail="Image is too small to analyse.")

    try:
        sample = extract_chromophores(img)
    except cv2.error as exc:
        raise HTTPException(status_code=422, detail=f"OpenCV pipeline failed: {exc}") from exc

    quality = quality_report(sample)
    hb = estimate_hemoglobin(sample.a_star, sample.erythema_index)

    convnext_ran = False
    if model is not None:
        try:
            with torch.no_grad():
                _ = model(tensor_from_bgr(sample.restored_bgr))
            convnext_ran = True
        except (RuntimeError, ValueError) as exc:
            # Backbone failure must not break the chromophore-based result.
            print(f"[HemaVision] ConvNeXt forward-pass skipped: {exc}")

    who = who_class(hb, sex_key)
    return {
        "scan_id": f"hv_{uuid.uuid4().hex[:10]}",
        "captured_at": datetime.now(timezone.utc).isoformat(),
        "hemoglobin_g_dL": round(hb, 2),
        "uncertainty_g_dL": uncertainty(quality["score"]),
        "status": triage_status(hb, sex_key),
        "who": who,
        "quality": quality,
        "metrics": {
            "cielab_a_star": round(sample.a_star, 2),
            "cielab_L": round(sample.L_star, 2),
            "cielab_b_star": round(sample.b_star, 2),
            "erythema_index": round(sample.erythema_index, 2),
            "opencv_a_channel": round(sample.opencv_a, 2),
        },
        "pipeline": [
            "center-crop reticle",
            "glare mask + Telea inpaint",
            "vascular high-pass",
            "CIELAB a*/L*/b*",
            "erythema index",
            "chromophore Hb",
        ],
        "model": {
            "backbone": "convnext_tiny",
            "loaded": model is not None,
            "forward_pass": convnext_ran,
            "clinical_source": "chromophore linear map (a*, EI)",
        },
    }
