"""Password hashing (bcrypt) and JWT helpers.

Uses the bcrypt library directly — the passlib bcrypt backend has version-
detection quirks with modern bcrypt releases, and we don't need passlib's
multi-scheme machinery for a single algorithm.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import bcrypt
from jose import JWTError, jwt

# bcrypt truncates silently at 72 bytes; guard against that so a short password
# and a padded-long one don't hash to the same digest.
_BCRYPT_MAX = 72


def _encode_password(raw: str) -> bytes:
    encoded = raw.encode("utf-8")
    if len(encoded) > _BCRYPT_MAX:
        raise ValueError(
            f"Password exceeds bcrypt's {_BCRYPT_MAX}-byte limit ({len(encoded)} bytes)."
        )
    return encoded


def hash_password(raw: str) -> str:
    return bcrypt.hashpw(_encode_password(raw), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(raw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_encode_password(raw), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(
    subject: str,
    secret: str,
    algorithm: str,
    expire_minutes: int,
) -> tuple[str, int]:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(minutes=expire_minutes)
    payload = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, secret, algorithm=algorithm)
    return token, expire_minutes * 60


def decode_token(token: str, secret: str, algorithm: str) -> Dict[str, Any]:
    try:
        return jwt.decode(token, secret, algorithms=[algorithm])
    except JWTError as exc:
        raise ValueError(str(exc)) from exc
