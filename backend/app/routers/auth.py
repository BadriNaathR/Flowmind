from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import LoginPayload, RegisterPayload, TokenOut, UserOut

router = APIRouter()

_GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


# ─── Email / Password ─────────────────────────────────────────────────────────

@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterPayload, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    user = User(
        email=payload.email,
        name=payload.name.strip(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(payload: LoginPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not user.password_hash:
        # No password set means they registered via Google
        if user and user.google_id:
            raise HTTPException(
                status_code=400,
                detail="This account uses Google Sign-In. Please continue with Google.",
            )
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(str(user.id))
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


# ─── Google OAuth ─────────────────────────────────────────────────────────────

@router.get("/google")
def google_login():
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth not configured — add GOOGLE_CLIENT_ID to .env")
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    return RedirectResponse(_GOOGLE_AUTH_URL + "?" + urlencode(params))


@router.get("/google/callback")
def google_callback(code: str, db: Session = Depends(get_db)):
    with httpx.Client(timeout=10) as client:
        token_resp = client.post(_GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        })
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="OAuth token exchange failed")

        token_data = token_resp.json()
        userinfo_resp = client.get(
            _GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Google user info")
        userinfo = userinfo_resp.json()

    is_new = False
    user = db.query(User).filter(User.google_id == userinfo["id"]).first()
    if not user:
        # Also check if they have a password account with same email
        user = db.query(User).filter(User.email == userinfo["email"]).first()
        if user:
            # Link Google to existing password account
            user.google_id = userinfo["id"]
            user.avatar_url = userinfo.get("picture")
        else:
            user = User(
                email=userinfo["email"],
                name=userinfo["name"],
                avatar_url=userinfo.get("picture"),
                google_id=userinfo["id"],
            )
            db.add(user)
            is_new = True
    else:
        user.name = userinfo["name"]
        user.avatar_url = userinfo.get("picture")

    db.commit()
    db.refresh(user)

    jwt_token = create_access_token(str(user.id))
    onboard = "1" if is_new else "0"
    return RedirectResponse(f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}&onboard={onboard}")


# ─── Current user ─────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
