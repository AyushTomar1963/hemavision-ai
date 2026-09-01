"""Single Limiter instance shared across routers.

Kept in its own module so analyze.py and auth.py can decorate their routes
without importing main.py (avoiding a circular import).
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

from config import get_settings

_settings = get_settings()

limiter = Limiter(key_func=get_remote_address, default_limits=[])

ANALYZE_LIMIT = _settings.rate_limit_analyze
AUTH_LIMIT = _settings.rate_limit_auth
