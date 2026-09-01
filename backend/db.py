"""Sqlite user store. Kept tiny — one table, no ORM."""

from __future__ import annotations

import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator, Optional

_LOCK = threading.Lock()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db(db_path: str) -> None:
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    with _connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


@contextmanager
def _connect(db_path: str) -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(db_path, timeout=5, isolation_level=None)
    try:
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        yield conn
    finally:
        conn.close()


def create_user(db_path: str, email: str, password_hash: str) -> dict:
    email = email.strip().lower()
    with _LOCK, _connect(db_path) as conn:
        try:
            cur = conn.execute(
                "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
                (email, password_hash, _now_iso()),
            )
        except sqlite3.IntegrityError as exc:
            raise ValueError("email_taken") from exc
        conn.commit()
        return {"id": cur.lastrowid, "email": email, "created_at": _now_iso()}


def get_user_by_email(db_path: str, email: str) -> Optional[dict]:
    with _connect(db_path) as conn:
        row = conn.execute(
            "SELECT id, email, password_hash, created_at FROM users WHERE email = ?",
            (email.strip().lower(),),
        ).fetchone()
    return dict(row) if row else None


def ensure_demo_user(
    db_path: str, email: str, password_hash: str
) -> None:
    if get_user_by_email(db_path, email) is None:
        try:
            create_user(db_path, email, password_hash)
        except ValueError:
            pass
