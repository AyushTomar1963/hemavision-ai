"""End-to-end tests for POST /analyze."""

from __future__ import annotations

import io


def _upload(jpeg_bytes: bytes, filename: str = "pink.jpg", mime: str = "image/jpeg"):
    return {"file": (filename, io.BytesIO(jpeg_bytes), mime)}


def test_analyze_happy_path(client, pink_jpeg):
    r = client.post("/analyze", files=_upload(pink_jpeg), data={"sex": "female"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["scan_id"].startswith("hv_")
    assert 3.0 <= body["hemoglobin_g_dL"] <= 18.0
    assert body["who"]["sex"] == "female"
    assert body["who"]["cutoff_g_dL"] == 12.0
    assert set(body["quality"]).issuperset({"score", "grade", "flags"})
    assert body["model"]["backbone"] == "convnext_tiny"


def test_analyze_normalises_bogus_sex(client, pink_jpeg):
    r = client.post("/analyze", files=_upload(pink_jpeg), data={"sex": "banana"})
    assert r.status_code == 200
    assert r.json()["who"]["sex"] == "unspecified"


def test_analyze_rejects_empty_upload(client):
    r = client.post("/analyze", files=_upload(b""))
    assert r.status_code == 400
    assert "Empty" in r.json()["detail"]


def test_analyze_rejects_non_image(client):
    r = client.post(
        "/analyze",
        files=_upload(b"not-a-picture-just-text", filename="not.txt", mime="text/plain"),
    )
    assert r.status_code == 415


def test_analyze_rejects_oversize_upload(client, monkeypatch, pink_jpeg):
    # Force a tiny cap and re-request.
    from config import get_settings

    settings = get_settings()
    monkeypatch.setattr(settings, "max_upload_bytes", 128)
    r = client.post("/analyze", files=_upload(pink_jpeg))
    assert r.status_code == 413


def test_analyze_bad_jpeg_bytes_returns_400(client):
    # Header says image/jpeg but the bytes are junk.
    r = client.post(
        "/analyze",
        files=_upload(b"\x00\x01\x02\x03\x04\x05" * 20, mime="image/jpeg"),
    )
    assert r.status_code in {400, 415}


def test_response_headers_carry_request_id(client, pink_jpeg):
    r = client.post("/analyze", files=_upload(pink_jpeg))
    assert "x-request-id" in r.headers
