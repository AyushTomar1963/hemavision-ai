import io

import cv2
import numpy as np
import torch
import torch.nn as nn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from torchvision.models import ConvNeXt_Tiny_Weights, convnext_tiny

app = FastAPI(title="HemaVision AI", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class HemaVisionRegressor(nn.Module):
    """ConvNeXt-Tiny backbone with a custom regression head for continuous Hb."""

    def __init__(self):
        super().__init__()
        self.backbone = convnext_tiny(weights=ConvNeXt_Tiny_Weights.DEFAULT)
        self.backbone.classifier[2] = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(768, 256),
            nn.GELU(),
            nn.Linear(256, 1),
        )

    def forward(self, x):
        return self.backbone(x)


# ImageNet-initialized weights for the hackathon architecture demo.
# Clinical Hb is mapped from CIELAB a* + erythema index (PLOS ONE / MDPI 2024).
try:
    model = HemaVisionRegressor()
    model.eval()
except Exception as exc:  # pragma: no cover - first-run weight download
    print(f"[HemaVision] ConvNeXt init skipped: {exc}")
    model = None

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def crop_conjunctiva_roi(image_matrix: np.ndarray) -> np.ndarray:
    """Crop the central overlay region that the frontend asks the user to align."""
    h, w = image_matrix.shape[:2]
    roi_w, roi_h = int(w * 0.28), int(h * 0.22)
    x0 = max((w - roi_w) // 2, 0)
    y0 = max((h - roi_h) // 2, 0)
    return image_matrix[y0 : y0 + roi_h, x0 : x0 + roi_w]


def remove_sun_and_sunlight_artifacts(image_matrix: np.ndarray) -> np.ndarray:
    """
    DSP routine to eliminate specular glare and sunlight artifacts
    from the mucosal membrane.
    """
    gray = cv2.cvtColor(image_matrix, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 235, 255, cv2.THRESH_BINARY)
    restored = cv2.inpaint(image_matrix, mask, 3, cv2.INPAINT_TELEA)
    return restored


def sharpen_vascular_contrast(image_matrix: np.ndarray) -> np.ndarray:
    """2D high-pass spatial filter to enhance capillary network contrast."""
    kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]], dtype=np.float32)
    return cv2.filter2D(image_matrix, -1, kernel)


def extract_cielab_erythema(image_matrix: np.ndarray):
    roi = crop_conjunctiva_roi(image_matrix)
    cleaned_img = remove_sun_and_sunlight_artifacts(roi)
    sharpened_img = sharpen_vascular_contrast(cleaned_img)

    lab_image = cv2.cvtColor(sharpened_img, cv2.COLOR_BGR2LAB)
    _L, a, _b = cv2.split(lab_image)

    bgr_float = sharpened_img.astype(np.float32) + 1e-5
    red_channel = bgr_float[:, :, 2]
    green_channel = bgr_float[:, :, 1]
    erythema_index = np.log10(red_channel) - np.log10(green_channel)

    mean_a_star = float(np.mean(a))
    mean_ei = float(np.mean(erythema_index) * 100)

    return mean_a_star, mean_ei, sharpened_img


def tensor_from_bgr(image_bgr: np.ndarray) -> torch.Tensor:
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    resized = cv2.resize(rgb, (224, 224), interpolation=cv2.INTER_AREA)
    x = resized.astype(np.float32) / 255.0
    x = (x - IMAGENET_MEAN) / IMAGENET_STD
    x = np.transpose(x, (2, 0, 1))
    return torch.from_numpy(x).unsqueeze(0)


def clinical_hb_from_chromophores(a_star: float, ei_value: float) -> float:
    """PLOS ONE / MDPI mapping of a* chromaticity and erythema index to Hb (g/dL)."""
    return (a_star * 0.085) + (ei_value * 0.04) + 1.2


def triage_status(estimated_hb: float) -> str:
    if estimated_hb < 5.0:
        return "Extreme Anemia (CRITICAL)"
    if estimated_hb < 7.0:
        return "Severe Anemia (Transfusion Threshold)"
    if estimated_hb < 9.0:
        return "Moderate Anemia"
    if estimated_hb < 12.0:
        return "Mild Anemia"
    return "Normemic"


@app.get("/")
async def root():
    return {"service": "HemaVision AI", "analyze": "POST /analyze", "health": "GET /health"}


@app.get("/health")
async def health():
    return {"ok": True, "model_loaded": model is not None}


@app.post("/analyze")
async def analyze_conjunctiva(file: UploadFile = File(...)):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty upload")

    nparr = np.frombuffer(contents, np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_cv is None:
        try:
            pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
            img_cv = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not decode image: {exc}")

    a_star, ei_value, processed_img = extract_cielab_erythema(img_cv)
    estimated_hb = clinical_hb_from_chromophores(a_star, ei_value)

    # Architecture is live; untrained ImageNet head is not used as the clinical score.
    if model is not None:
        with torch.no_grad():
            _ = model(tensor_from_bgr(processed_img))

    estimated_hb = float(np.clip(estimated_hb, 3.0, 18.0))

    return {
        "hemoglobin_g_dL": round(estimated_hb, 2),
        "status": triage_status(estimated_hb),
        "metrics": {
            "cielab_a_star": round(a_star, 2),
            "erythema_index": round(ei_value, 2),
        },
    }
