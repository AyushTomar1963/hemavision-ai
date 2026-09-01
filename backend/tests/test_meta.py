"""Smoke tests for the read-only informational endpoints."""

from __future__ import annotations


def test_root_lists_routes(client):
    r = client.get("/")
    assert r.status_code == 200
    body = r.json()
    assert body["service"] == "HemaVision"
    assert "/analyze" in body["routes"]
    assert "/auth/login" in body["routes"]


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert isinstance(body["model_loaded"], bool)
    assert isinstance(body["version"], str)


def test_papers(client):
    r = client.get("/papers")
    assert r.status_code == 200
    papers = r.json()["papers"]
    assert isinstance(papers, list) and len(papers) > 5
    assert all("doi" in p and "used_for" in p for p in papers)


def test_features(client):
    r = client.get("/features")
    assert r.status_code == 200
    feats = r.json()["features"]
    assert any(f["group"] == "Capture" for f in feats)


def test_request_id_header_present(client):
    r = client.get("/health")
    assert "x-request-id" in r.headers
    assert len(r.headers["x-request-id"]) >= 8


def test_error_envelope_has_request_id(client):
    r = client.get("/does-not-exist")
    assert r.status_code == 404
    body = r.json()
    assert "detail" in body and "request_id" in body
