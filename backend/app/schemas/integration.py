from datetime import datetime
from pydantic import BaseModel


class IntegrationOut(BaseModel):
    provider: str
    connected: bool
    connected_at: datetime | None = None


class ConnectPayload(BaseModel):
    mock: bool = False
