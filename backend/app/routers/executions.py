"""
Sprint 3 — Workflow Execution endpoints.

POST /api/v1/workflows/{workflow_id}/test  → start a test run, return run_id
GET  /api/v1/stream/{run_id}               → SSE stream of step events
"""
import asyncio
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user, get_current_user_query
from app.models.user import User
from app.models.workflow import Workflow
from app.models.workflow_run import WorkflowRun, RunStatus
from app.agents.executor import execute_workflow_stream

router = APIRouter()


@router.post("/workflows/{workflow_id}/test")
def start_test_run(
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

    run = WorkflowRun(
        id=uuid.uuid4(),
        workflow_id=workflow_id,
        status=RunStatus.RUNNING,
        started_at=datetime.now(timezone.utc),
        trigger_data={"source": "test"},
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    return {"run_id": str(run.id)}


@router.get("/stream/{run_id}")
async def stream_run(
    run_id: uuid.UUID,
    current_user: User = Depends(get_current_user_query),
    db: Session = Depends(get_db),
):
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found.")

    wf = db.query(Workflow).filter(
        Workflow.id == run.workflow_id,
        Workflow.user_id == current_user.id,
    ).first()
    if not wf:
        raise HTTPException(status_code=403, detail="Access denied.")

    async def event_generator():
        try:
            async for event in execute_workflow_stream(run_id, db):
                yield f"data: {json.dumps(event)}\n\n"
                await asyncio.sleep(0)
        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
