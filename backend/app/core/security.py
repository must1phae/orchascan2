"""
OrchaScan 2.0 — Security / Auth
Validates Supabase JWTs using the JWKS endpoint.

Supabase now uses ECC P-256 (ES256) asymmetric signing by default.
We fetch the public keys from the JWKS endpoint and verify locally —
no shared secret needed.
"""

import logging
from functools import lru_cache

import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.config import get_settings

logger = logging.getLogger(__name__)

security = HTTPBearer()


@lru_cache(maxsize=1)
def _get_jwks_client() -> PyJWKClient:
    """
    Build a cached JWKS client pointing at the Supabase auth JWKS endpoint.
    The client automatically fetches and caches the public keys.
    """
    settings = get_settings()
    jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
    logger.info(f"JWKS endpoint: {jwks_url}")
    return PyJWKClient(jwks_url, cache_keys=True)


class _User:
    """Lightweight user object built from the decoded JWT payload."""
    def __init__(self, payload: dict):
        self.id    = payload.get("sub", "")
        self.email = payload.get("email", "")
        self.role  = payload.get("role", "authenticated")

    def __repr__(self):
        return f"<User id={self.id} email={self.email}>"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> _User:
    """
    Validate the Supabase JWT and return a user object.

    Verification order:
      1. JWKS endpoint (ES256/ECC P-256) — preferred, works with new Supabase key format.
      2. Supabase SDK auth.get_user() — fallback for legacy tokens.
    """
    token = credentials.credentials

    # ── 1. JWKS verification (ES256 / RS256 / HS256 — auto-detected) ─────────
    try:
        jwks_client = _get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256", "HS256"],
            options={"verify_aud": False},  # Supabase tokens don't always set aud
        )
        sub = payload.get("sub")
        if not sub:
            raise ValueError("JWT has no 'sub' claim")
        logger.debug(f"Auth OK via JWKS: user={sub}")
        return _User(payload)

    except jwt.ExpiredSignatureError:
        logger.warning("Token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired — please log in again",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as jwks_err:
        logger.warning(f"JWKS verification failed: {jwks_err} — trying SDK fallback")

    # ── 2. Supabase SDK fallback (auth.get_user network call) ────────────────
    try:
        from app.services.supabase_service import get_supabase
        client = get_supabase()
        response = client.auth.get_user(token)
        if response and response.user:
            logger.debug(f"Auth OK via SDK: user={response.user.id}")
            return response.user
    except Exception as sdk_err:
        logger.warning(f"SDK get_user() failed: {sdk_err}")

    # ── Both strategies failed ────────────────────────────────────────────────
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
