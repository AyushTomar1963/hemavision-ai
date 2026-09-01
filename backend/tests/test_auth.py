"""Signup / login / me + the AUTH_REQUIRED gate."""

from __future__ import annotations

import io


def _upload(jpeg_bytes: bytes):
    return {"file": ("pink.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")}


class TestSignupLogin:
    def test_signup_then_me(self, client):
        r = client.post("/auth/signup", json={"email": "a@b.com", "password": "s3cretpass"})
        assert r.status_code == 201, r.text
        token = r.json()["access_token"]

        me = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me.status_code == 200
        assert me.json()["email"] == "a@b.com"

    def test_signup_duplicate_email(self, client):
        payload = {"email": "dup@x.com", "password": "s3cretpass"}
        client.post("/auth/signup", json=payload)
        r2 = client.post("/auth/signup", json=payload)
        assert r2.status_code == 409

    def test_signup_password_too_short(self, client):
        r = client.post("/auth/signup", json={"email": "a@x.com", "password": "short"})
        assert r.status_code == 422

    def test_login_wrong_password(self, client):
        client.post("/auth/signup", json={"email": "a@b.com", "password": "s3cretpass"})
        r = client.post("/auth/login", json={"email": "a@b.com", "password": "wrong"})
        assert r.status_code == 401

    def test_me_without_token(self, client):
        r = client.get("/auth/me")
        assert r.status_code == 401

    def test_me_with_bogus_token(self, client):
        r = client.get("/auth/me", headers={"Authorization": "Bearer not-a-real-jwt"})
        assert r.status_code == 401


class TestAuthGate:
    def test_analyze_requires_auth_when_enabled(self, client_auth_required, pink_jpeg):
        r = client_auth_required.post("/analyze", files=_upload(pink_jpeg))
        assert r.status_code == 401

    def test_analyze_passes_with_token(self, client_auth_required, pink_jpeg):
        signup = client_auth_required.post(
            "/auth/signup", json={"email": "x@y.com", "password": "s3cretpass"}
        )
        token = signup.json()["access_token"]
        r = client_auth_required.post(
            "/analyze",
            files=_upload(pink_jpeg),
            headers={"Authorization": f"Bearer {token}"},
        )
        assert r.status_code == 200

    def test_demo_user_can_log_in(self, client_auth_required):
        # ensure_demo_user seeded during startup
        r = client_auth_required.post(
            "/auth/login",
            json={"email": "demo@hemavision.ai", "password": "demo1234"},
        )
        assert r.status_code == 200
        assert "access_token" in r.json()
