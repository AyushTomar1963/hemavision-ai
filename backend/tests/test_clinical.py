"""Unit tests for the clinical helpers — pure math, no I/O."""

from __future__ import annotations

import pytest

from clinical import (
    A_STAR_COEF,
    EI_COEF,
    INTERCEPT,
    WHO_CUTOFF,
    estimate_hemoglobin,
    triage_status,
    uncertainty,
    who_class,
)


class TestEstimateHemoglobin:
    def test_matches_linear_formula_in_range(self):
        assert estimate_hemoglobin(20.0, 16.0) == pytest.approx(
            INTERCEPT + A_STAR_COEF * 20.0 + EI_COEF * 16.0, rel=1e-6
        )

    def test_clips_low(self):
        assert estimate_hemoglobin(-1000, -1000) == 3.0

    def test_clips_high(self):
        assert estimate_hemoglobin(1000, 1000) == 18.0


class TestUncertainty:
    def test_high_quality_narrow_band(self):
        assert uncertainty(0.95) <= 1.5

    def test_low_quality_wide_band(self):
        assert uncertainty(0.2) >= 2.0

    def test_clamped(self):
        assert 0.9 <= uncertainty(1.5) <= 2.4
        assert 0.9 <= uncertainty(-0.5) <= 2.4


class TestWhoClass:
    def test_severe_below_8(self):
        assert who_class(6.0, "female")["severity"] == "severe"

    def test_moderate_band(self):
        assert who_class(9.5, "female")["severity"] == "moderate"

    def test_mild_female(self):
        assert who_class(11.5, "female")["severity"] == "mild"

    def test_none_male_above_cutoff(self):
        assert who_class(13.5, "male")["severity"] == "none"

    def test_unspecified_falls_back(self):
        assert who_class(11.5, "banana")["sex"] == "unspecified"
        assert who_class(11.5, "banana")["cutoff_g_dL"] == WHO_CUTOFF["unspecified"]


class TestTriage:
    def test_critical(self):
        assert triage_status(4.0, "male") == "Critical — emergency evaluation"

    def test_severe(self):
        assert "AABB" in triage_status(6.5, "male")

    def test_moderate(self):
        assert "high-yield" in triage_status(8.0, "male")

    def test_mild(self):
        assert "Mild" in triage_status(11.5, "female")

    def test_screening_range(self):
        assert triage_status(14.0, "female") == "Within screening range"
