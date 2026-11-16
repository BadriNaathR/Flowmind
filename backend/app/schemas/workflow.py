import uuid
from datetime import datetime

from pydantic import BaseModel


class WorkflowStepOut(BaseModel):
    step_id: str
    type: str
    integration: str
    action: str
    params: dict


class WorkflowCreate(BaseModel):
    raw_input: str


class WorkflowOut(BaseModel):
    id: uuid.UUID
    name: str
    status: str
    run_count: int
    last_run_at: datetime | None = None
    created_at: datetime
    trigger: dict
    steps: list[WorkflowStepOut]
    raw_input: str
    confidence: int | None = None
    confidence_reason: str | None = None

    model_config = {"from_attributes": True}


class WorkflowListItem(BaseModel):
    id: uuid.UUID
    name: str
    status: str
    run_count: int
    last_run_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
