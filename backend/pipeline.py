"""OpenCV DSP: ROI, glare inpaint, vascular sharpen, CIELAB, erythema index."""

from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np

GLARE_THRESHOLD = 235
SHARPEN_KERNEL = np.array(
    [[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]], dtype=np.float32
)


@dataclass
class ChromophoreSample:
    image_bgr: np.ndarray
    roi_bgr: np.ndarray
    restored_bgr: np.ndarray
    a_star: float
    opencv_a: float
    L_star: float
    b_star: float
    erythema_index: float
    glare_pct: float
    roi_px: int
    mean_luminance: float


def decode_image(contents: bytes) -> np.ndarray | None:
    arr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    return img


def crop_reticle_roi(image_bgr: np.ndarray) -> np.ndarray:
    h, w = image_bgr.shape[:2]
    roi_w, roi_h = max(int(w * 0.36), 32), max(int(h * 0.28), 24)
    x0 = max((w - roi_w) // 2, 0)
    y0 = max((h - roi_h) // 2, 0)
    return image_bgr[y0 : y0 + roi_h, x0 : x0 + roi_w]


def remove_glare(image_bgr: np.ndarray) -> tuple[np.ndarray, float]:
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, GLARE_THRESHOLD, 255, cv2.THRESH_BINARY)
    glare_pct = float(np.mean(mask > 0) * 100.0)
    if glare_pct < 0.15:
        return image_bgr, glare_pct
    restored = cv2.inpaint(image_bgr, mask, 3, cv2.INPAINT_TELEA)
    return restored, glare_pct


def sharpen_vessels(image_bgr: np.ndarray) -> np.ndarray:
    return cv2.filter2D(image_bgr, -1, SHARPEN_KERNEL)


def extract_chromophores(image_bgr: np.ndarray) -> ChromophoreSample:
    roi = crop_reticle_roi(image_bgr)
    restored, glare_pct = remove_glare(roi)
    sharp = sharpen_vessels(restored)

    lab = cv2.cvtColor(sharp, cv2.COLOR_BGR2LAB)
    L, a, b = cv2.split(lab)
    opencv_a = float(np.mean(a))
    # OpenCV 8-bit Lab: a and b are shifted by 128.
    a_star = opencv_a - 128.0
    L_star = float(np.mean(L)) * (100.0 / 255.0)
    b_star = float(np.mean(b)) - 128.0

    bgr = sharp.astype(np.float32) + 1e-5
    ei = float(np.mean(np.log10(bgr[:, :, 2]) - np.log10(bgr[:, :, 1])) * 100.0)

    gray = cv2.cvtColor(sharp, cv2.COLOR_BGR2GRAY)
    return ChromophoreSample(
        image_bgr=image_bgr,
        roi_bgr=roi,
        restored_bgr=sharp,
        a_star=a_star,
        opencv_a=opencv_a,
        L_star=L_star,
        b_star=b_star,
        erythema_index=ei,
        glare_pct=glare_pct,
        roi_px=int(sharp.shape[0] * sharp.shape[1]),
        mean_luminance=float(np.mean(gray)),
    )


def quality_report(sample: ChromophoreSample) -> dict:
    flags: list[str] = []
    score = 0.92

    if sample.roi_px < 2500:
        flags.append("ROI is too small — move closer or zoom.")
        score -= 0.35
    if sample.glare_pct > 18:
        flags.append("Specular glare still high after inpainting.")
        score -= 0.18
    elif sample.glare_pct > 8:
        flags.append("Mild glare on the mucosa.")
        score -= 0.08
    if sample.mean_luminance < 40:
        flags.append("Frame is underexposed.")
        score -= 0.16
    if sample.mean_luminance > 210:
        flags.append("Frame is overexposed.")
        score -= 0.16
    if sample.a_star < 2:
        flags.append("Little red–green chroma — the oval may not be on conjunctiva.")
        score -= 0.22

    score = float(np.clip(score, 0.2, 0.95))
    if score >= 0.8 and not flags:
        grade = "good"
    elif score >= 0.6:
        grade = "acceptable"
    else:
        grade = "poor"

    return {
        "score": round(score, 2),
        "grade": grade,
        "flags": flags,
        "glare_pct": round(sample.glare_pct, 2),
        "mean_luminance": round(sample.mean_luminance, 1),
        "roi_px": sample.roi_px,
    }
