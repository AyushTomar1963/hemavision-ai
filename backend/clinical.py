"""Hb mapping and WHO / AABB triage."""

from __future__ import annotations

import numpy as np

# Linear map inspired by Dimauro (a*) + Collings (EI). Intercept set so a typical
# vascular palpebral ROI (a* ≈ 20, EI ≈ 16) lands near 13 g/dL.
A_STAR_COEF = 0.18
EI_COEF = 0.11
INTERCEPT = 7.6

WHO_CUTOFF = {"female": 12.0, "male": 13.0, "unspecified": 12.0}


def estimate_hemoglobin(a_star: float, erythema_index: float) -> float:
    hb = INTERCEPT + A_STAR_COEF * a_star + EI_COEF * erythema_index
    return float(np.clip(hb, 3.0, 18.0))


def uncertainty(quality_score: float) -> float:
    # Zhao 2024 LoA were wide (~±4.8). We report a quality-scaled half-width, not LoA.
    return round(float(np.clip(2.6 - 1.4 * quality_score, 0.9, 2.4)), 1)


def who_class(hb: float, sex: str) -> dict:
    key = sex if sex in WHO_CUTOFF else "unspecified"
    cutoff = WHO_CUTOFF[key]
    anemic = hb < cutoff
    if hb < 8.0:
        severity = "severe"
    elif hb < 11.0:
        severity = "moderate"
    elif anemic:
        severity = "mild"
    else:
        severity = "none"
    return {
        "sex": key,
        "anemia": anemic,
        "cutoff_g_dL": cutoff,
        "severity": severity,
    }


def triage_status(hb: float, sex: str) -> str:
    if hb < 5.0:
        return "Critical — emergency evaluation"
    if hb < 7.0:
        return "Severe — AABB transfusion threshold"
    if hb < 9.0:
        return "Moderate — high-yield 7–9 g/dL band"
    who = who_class(hb, sex)
    if who["anemia"]:
        return "Mild anaemia (WHO adult cutoff)"
    return "Within screening range"
