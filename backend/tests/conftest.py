"""Test fixtures.

Every test gets a fresh sqlite DB and a fresh Settings instance, so auth
tests can't leak users into each other and CORS/rate-limit envs stay pinned.
"""

from __future__ import annotations

import io
import os
import sys
import uuid
from pathlib import Path

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture()
def tmp_db_path(tmp_path) -> str:
    return str(tmp_path / f"test_{uuid.uuid4().hex}.db")


@pytest.fixture()
def client(monkeypatch, tmp_db_path) -> TestClient:
    monkeypatch.setenv("HEMAVISION_DB_PATH", tmp_db_path)
    monkeypatch.setenv("HEMAVISION_RUN_CONVNEXT", "false")
    monkeypatch.setenv("HEMAVISION_AUTH_REQUIRED", "false")
    monkeypatch.setenv("HEMAVISION_JWT_SECRET", "test-secret-please")
    monkeypatch.setenv("HEMAVISION_RATE_LIMIT_ANALYZE", "1000/minute")
    monkeypatch.setenv("HEMAVISION_RATE_LIMIT_AUTH", "1000/minute")

    # Reload settings so env changes take effect.
    from config import get_settings

    get_settings.cache_clear()

    # Reimport main to pick up the fresh Settings singleton.
    for mod in ["main", "meta", "auth", "analyze", "rate_limit"]:
        sys.modules.pop(mod, None)

    from main import app  # noqa: WPS433 — reimport is intentional

    with TestClient(app) as tc:
        yield tc


@pytest.fixture()
def client_auth_required(monkeypatch, tmp_db_path) -> TestClient:
    monkeypatch.setenv("HEMAVISION_DB_PATH", tmp_db_path)
    monkeypatch.setenv("HEMAVISION_RUN_CONVNEXT", "false")
    monkeypatch.setenv("HEMAVISION_AUTH_REQUIRED", "true")
    monkeypatch.setenv("HEMAVISION_JWT_SECRET", "test-secret-please")
    monkeypatch.setenv("HEMAVISION_RATE_LIMIT_ANALYZE", "1000/minute")
    monkeypatch.setenv("HEMAVISION_RATE_LIMIT_AUTH", "1000/minute")

    from config import get_settings

    get_settings.cache_clear()
    for mod in ["main", "meta", "auth", "analyze", "rate_limit"]:
        sys.modules.pop(mod, None)

    from main import app  # noqa: WPS433

    with TestClient(app) as tc:
        yield tc


def _pink_jpeg_bytes(size: int = 256) -> bytes:
    """A synthetic pink 'conjunctiva' — high red, mid green, low blue."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    img[:, :, 2] = 210  # R (BGR order)
    img[:, :, 1] = 120  # G
    img[:, :, 0] = 110  # B
    ok, encoded = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 92])
    assert ok, "cv2.imencode failed"
    return encoded.tobytes()


@pytest.fixture()
def pink_jpeg() -> bytes:
    return _pink_jpeg_bytes()


@pytest.fixture()
def pink_upload(pink_jpeg):
    return ("file", ("pink.jpg", io.BytesIO(pink_jpeg), "image/jpeg"))
