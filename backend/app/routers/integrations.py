import base64
import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import encrypt_token
from app.dependencies import get_current_user, get_current_user_query
from app.models.integration import Integration
from app.models.user import User
from app.schemas.integration import ConnectPayload, IntegrationOut

router = APIRouter()

_PROVIDERS = ["gmail", "slack", "sheets", "notion"]
_GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_SLACK_AUTH_URL = "https://slack.com/oauth/v2/authorize"
_SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access"


def _pkce_pair() -> tuple[str, str]:
    """Return (code_verifier, code_challenge) for PKCE."""
    verifier = secrets.token_urlsafe(32)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()
    ).rstrip(b"=").decode()
    return verifier, challenge


def _save_google_tokens(user_id: uuid.UUID, token_data: dict, db: Session) -> None:
    """Persist Google access + refresh tokens for both gmail and sheets providers."""
    access_token = token_data.get("access_token", "")
    refresh_token = token_data.get("refresh_token")
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 3600))

    for provider in ["gmail", "sheets"]:
        existing = (
            db.query(Integration)
            .filter(Integration.user_id == user_id, Integration.provider == provider)
            .first()
        )
        if existing:
            existing.access_token = encrypt_token(access_token)
            if refresh_token:
                existing.refresh_token = encrypt_token(refresh_token)
            existing.expires_at = expires_at
            existing.metadata_ = {"real": True}
        else:
            db.add(Integration(
                user_id=user_id,
                provider=provider,
                access_token=encrypt_token(access_token),
                refresh_token=encrypt_token(refresh_token) if refresh_token else None,
                expires_at=expires_at,
                scopes="gmail.modify spreadsheets",
                metadata_={"real": True},
            ))
    db.commit()


# ─── List integrations ────────────────────────────────────────────────────────

@router.get("", response_model=list[IntegrationOut])
def list_integrations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    connected = {i.provider: i for i in current_user.integrations}
    return [
        IntegrationOut(
            provider=p,
            connected=p in connected,
            connected_at=connected[p].created_at if p in connected else None,
        )
        for p in _PROVIDERS
    ]


# ─── Google OAuth (Gmail + Sheets) ───────────────────────────────────────────

@router.get("/google/connect")
def google_connect(current_user: User = Depends(get_current_user_query)):
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth not configured")
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_INTEGRATION_REDIRECT_URI,
        "response_type": "code",
        "scope": (
            "openid email profile "
            "https://www.googleapis.com/auth/gmail.modify "
            "https://www.googleapis.com/auth/spreadsheets"
        ),
        "access_type": "offline",
        "prompt": "consent",
        "state": str(current_user.id),
    }
    return RedirectResponse(_GOOGLE_AUTH_URL + "?" + urlencode(params))


@router.get("/google/callback")
def google_callback(
    code: Optional[str] = Query(default=None),
    state: str = "",
    error: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    if error or not code:
        return RedirectResponse(f"{settings.FRONTEND_URL}/onboarding?error=google_cancelled")
    with httpx.Client(timeout=10, verify=False) as client:
        resp = client.post(_GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_INTEGRATION_REDIRECT_URI,
            "grant_type": "authorization_code",
        })
        if resp.status_code != 200:
            return RedirectResponse(f"{settings.FRONTEND_URL}/onboarding?error=google_failed")
        token_data = resp.json()

    try:
        user_id = uuid.UUID(state)
    except ValueError:
        return RedirectResponse(f"{settings.FRONTEND_URL}/onboarding?error=invalid_state")

    _save_google_tokens(user_id, token_data, db)
    return RedirectResponse(f"{settings.FRONTEND_URL}/onboarding?connected=google")


# ─── Slack OAuth ──────────────────────────────────────────────────────────────

@router.get("/slack/connect")
def slack_connect(current_user: User = Depends(get_current_user_query)):
    if not settings.SLACK_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Slack OAuth not configured")
    verifier, challenge = _pkce_pair()
    # Embed verifier in state so we can retrieve it in callback
    state = f"{current_user.id}:{verifier}"
    params = {
        "client_id": settings.SLACK_CLIENT_ID,
        "redirect_uri": settings.SLACK_REDIRECT_URI,
        "scope": "chat:write channels:read",
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    }
    return RedirectResponse(_SLACK_AUTH_URL + "?" + urlencode(params))


@router.get("/slack/callback")
def slack_callback(
    code: Optional[str] = Query(default=None),
    state: str = "",
    error: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    if error or not code:
        return RedirectResponse(f"{settings.FRONTEND_URL}/onboarding?error=slack_cancelled")

    # state = "<user_id>:<code_verifier>"
    parts = state.split(":", 1)
    try:
        user_id = uuid.UUID(parts[0])
    except ValueError:
        return RedirectResponse(f"{settings.FRONTEND_URL}/onboarding?error=invalid_state")
    code_verifier = parts[1] if len(parts) > 1 else ""

    with httpx.Client(timeout=10, verify=False) as client:
        resp = client.post(_SLACK_TOKEN_URL, data={
            "code": code,
            "client_id": settings.SLACK_CLIENT_ID,
            "redirect_uri": settings.SLACK_REDIRECT_URI,
            "code_verifier": code_verifier,
        })
        if resp.status_code != 200:
            return RedirectResponse(f"{settings.FRONTEND_URL}/onboarding?error=slack_failed")
        data = resp.json()

    if not data.get("ok"):
        return RedirectResponse(f"{settings.FRONTEND_URL}/onboarding?error=slack_failed")

    bot_token = data.get("access_token", "")
    team_name = data.get("team", {}).get("name", "")

    existing = (
        db.query(Integration)
        .filter(Integration.user_id == user_id, Integration.provider == "slack")
        .first()
    )
    if existing:
        existing.access_token = encrypt_token(bot_token)
        existing.metadata_ = {"real": True, "team_name": team_name}
    else:
        db.add(Integration(
            user_id=user_id,
            provider="slack",
            access_token=encrypt_token(bot_token),
            scopes="chat:write channels:read",
            metadata_={"real": True, "team_name": team_name},
        ))
    db.commit()
    return RedirectResponse(f"{settings.FRONTEND_URL}/onboarding?connected=slack")


# ─── Generic connect (Notion uses global API key) ─────────────────────────────

@router.post("/{provider}/connect", response_model=IntegrationOut)
def connect_integration(
    provider: str,
    payload: ConnectPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if provider not in _PROVIDERS:
        raise HTTPException(status_code=404, detail="Unknown provider")

    if provider == "notion" and settings.NOTION_API_KEY:
        token = settings.NOTION_API_KEY
        is_real = True
    elif provider == "slack" and settings.SLACK_BOT_TOKEN:
        token = settings.SLACK_BOT_TOKEN
        is_real = True
    else:
        token = "mock_placeholder"
        is_real = False

    existing = (
        db.query(Integration)
        .filter(Integration.user_id == current_user.id, Integration.provider == provider)
        .first()
    )
    if existing:
        # Always refresh the token in case the env key was added after first connect
        existing.access_token = encrypt_token(token)
        existing.metadata_ = {"real": is_real}
        db.commit()
        return IntegrationOut(provider=provider, connected=True, connected_at=existing.created_at)

    integration = Integration(
        user_id=current_user.id,
        provider=provider,
        access_token=encrypt_token(token),
        metadata_={"real": is_real},
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)

    return IntegrationOut(provider=provider, connected=True, connected_at=integration.created_at)


# ─── Disconnect ───────────────────────────────────────────────────────────────

@router.delete("/{provider}")
def disconnect_integration(
    provider: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if provider not in _PROVIDERS:
        raise HTTPException(status_code=404, detail="Unknown provider")

    integration = (
        db.query(Integration)
        .filter(Integration.user_id == current_user.id, Integration.provider == provider)
        .first()
    )
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not connected")

    db.delete(integration)
    db.commit()
    return {"ok": True}
