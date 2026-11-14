from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import encrypt_token
from app.dependencies import get_current_user
from app.models.integration import Integration
from app.models.user import User
from app.schemas.integration import ConnectPayload, IntegrationOut

router = APIRouter()

_PROVIDERS = ["gmail", "slack", "sheets", "notion"]


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


@router.post("/{provider}/connect", response_model=IntegrationOut)
def connect_integration(
    provider: str,
    payload: ConnectPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if provider not in _PROVIDERS:
        raise HTTPException(status_code=404, detail="Unknown provider")

    existing = (
        db.query(Integration)
        .filter(Integration.user_id == current_user.id, Integration.provider == provider)
        .first()
    )
    if existing:
        return IntegrationOut(provider=provider, connected=True, connected_at=existing.created_at)

    integration = Integration(
        user_id=current_user.id,
        provider=provider,
        access_token=encrypt_token("mock_placeholder"),
        metadata_={"mock": True},
    )
    db.add(integration)
    db.commit()
    db.refresh(integration)

    return IntegrationOut(provider=provider, connected=True, connected_at=integration.created_at)


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
