import io
import uuid
from datetime import datetime, timezone

import cv2
import numpy as np
import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from catalog import FEATURES, PAPERS
from clinical import estimate_hemoglobin, triage_status, uncertainty, who_class
from model import load_model, tensor_from_bgr
from pipeline import decode_image, extract_chromophores, quality_report

app = FastAPI(
    title="HemaVision",
    version="2.0.0",
    description="Palpebral conjunctiva haemoglobin screening — not a CBC.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = load_model()


def bgr_from_upload(contents: bytes) -> np.ndarray:
    img = decode_image(contents)
    if img is not None:
        return img
    try:
        pil = Image.open(io.BytesIO(contents)).convert("RGB")
        return cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not decode image: {exc}") from exc


@app.get("/")
async def root():
    return {
        "service": "HemaVision",
        "version": "2.0.0",
        "routes": ["/analyze", "/health", "/papers", "/features"],
    }


@app.get("/health")
async def health():
    return {"ok": True, "model_loaded": model is not None, "version": "2.0.0"}


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
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty upload")

    sex_key = (sex or "unspecified").strip().lower()
    if sex_key not in {"female", "male", "unspecified"}:
        sex_key = "unspecified"

    img = bgr_from_upload(contents)
    sample = extract_chromophores(img)
    quality = quality_report(sample)
    hb = estimate_hemoglobin(sample.a_star, sample.erythema_index)

    convnext_ran = False
    if model is not None:
        with torch.no_grad():
            _ = model(tensor_from_bgr(sample.restored_bgr))
        convnext_ran = True

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
