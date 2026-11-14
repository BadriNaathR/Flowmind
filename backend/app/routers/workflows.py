import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.workflow import Workflow, WorkflowStatus
from app.schemas.workflow import WorkflowCreate, WorkflowListItem, WorkflowOut
from app.agents.workflow_agent import decompose_workflow

router = APIRouter()


@router.post("", response_model=WorkflowOut, status_code=201)
def create_workflow(
    payload: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.raw_input.strip():
        raise HTTPException(status_code=422, detail="Workflow description cannot be empty.")

    try:
        ai_result = decompose_workflow(payload.raw_input)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {exc}")

    workflow = Workflow(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=ai_result.get("name", "My Workflow"),
        raw_input=payload.raw_input,
        trigger=ai_result.get("trigger", {"type": "manual", "config": {}}),
        steps=ai_result.get("steps", []),
        status=WorkflowStatus.DRAFT,
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.get("", response_model=list[WorkflowListItem])
def list_workflows(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Workflow)
        .filter(Workflow.user_id == current_user.id)
        .order_by(Workflow.created_at.desc())
        .all()
    )


@router.get("/{workflow_id}", response_model=WorkflowOut)
def get_workflow(
    workflow_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wf = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id,
    ).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found.")
    return wf


@router.patch("/{workflow_id}/activate", response_model=WorkflowOut)
def activate_workflow(
    workflow_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    wf = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id,
    ).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found.")
    wf.status = WorkflowStatus.ACTIVE
    db.commit()
    db.refresh(wf)
    return wf
