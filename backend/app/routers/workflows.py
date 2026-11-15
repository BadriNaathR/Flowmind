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


@router.patch("/{workflow_id}/pause", response_model=WorkflowOut)
def pause_workflow(
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
    wf.status = WorkflowStatus.PAUSED if wf.status == WorkflowStatus.ACTIVE else WorkflowStatus.ACTIVE
    db.commit()
    db.refresh(wf)
    return wf


@router.delete("/{workflow_id}", status_code=204)
def delete_workflow(
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
    db.delete(wf)
    db.commit()


@router.get("/{workflow_id}/runs")
def list_runs(
    workflow_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.models.workflow_run import WorkflowRun
    from app.models.workflow_run_log import WorkflowRunLog

    wf = db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.user_id == current_user.id,
    ).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found.")

    runs = (
        db.query(WorkflowRun)
        .filter(WorkflowRun.workflow_id == workflow_id)
        .order_by(WorkflowRun.started_at.desc())
        .limit(20)
        .all()
    )

    result = []
    for run in runs:
        logs = (
            db.query(WorkflowRunLog)
            .filter(WorkflowRunLog.run_id == run.id)
            .order_by(WorkflowRunLog.step_index)
            .all()
        )
        result.append({
            "id": str(run.id),
            "status": run.status,
            "started_at": run.started_at.isoformat() if run.started_at else None,
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
            "steps": [
                {
                    "step_index": log.step_index,
                    "integration": log.integration,
                    "status": log.status,
                    "error_message": log.error_message,
                    "duration_ms": (
                        int((log.completed_at - log.started_at).total_seconds() * 1000)
                        if log.completed_at and log.started_at else None
                    ),
                    "output": log.output_data,
                }
                for log in logs
            ],
        })
    return result
