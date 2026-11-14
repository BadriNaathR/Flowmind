"""
Workflow Execution Engine.

Runs workflow steps in sequence, logging each to the DB and yielding
SSE-compatible event dicts. Integration clients run in a thread pool
so their time.sleep() calls don't block the event loop.

Dev mode: synchronous execution with asyncio.to_thread — no Celery/Redis needed.
Production: replace the async generator body with a Celery task + Redis pub/sub.
"""
import asyncio
import time
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.workflow_run import WorkflowRun, RunStatus
from app.models.workflow_run_log import WorkflowRunLog, StepStatus


def _get_client(integration: str):
    if integration == "gmail":
        from app.integrations.gmail import GmailClient
        return GmailClient()
    if integration == "slack":
        from app.integrations.slack import SlackClient
        return SlackClient()
    if integration == "sheets":
        from app.integrations.sheets import SheetsClient
        return SheetsClient()
    if integration == "notion":
        from app.integrations.notion import NotionClient
        return NotionClient()
    from app.integrations.base import GenericClient
    return GenericClient()


async def execute_workflow_stream(run_id: uuid.UUID, db: Session):
    """
    Async generator — yields event dicts as steps execute.
    Caller wraps each event as `data: <json>\n\n` for SSE.
    """
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        yield {"type": "error", "message": "Run not found"}
        return

    workflow = run.workflow
    steps: list[dict] = workflow.steps or []

    yield {
        "type": "run_started",
        "run_id": str(run_id),
        "workflow_name": workflow.name,
        "total_steps": len(steps),
    }

    overall_success = True

    for i, step in enumerate(steps):
        step_id = step.get("step_id", f"step_{i + 1}")
        integration = step.get("integration", "internal")
        action = step.get("action", "execute")
        params = step.get("params", {})

        log = WorkflowRunLog(
            id=uuid.uuid4(),
            run_id=run_id,
            step_index=i,
            step_type=step.get("type", "action"),
            integration=integration,
            status=StepStatus.RUNNING,
            started_at=datetime.now(timezone.utc),
            input_data=params,
        )
        db.add(log)
        db.commit()

        yield {
            "type": "step_started",
            "step_index": i,
            "step_id": step_id,
            "integration": integration,
            "action": action,
        }

        t0 = time.monotonic()
        try:
            client = _get_client(integration)
            output = await asyncio.to_thread(client.execute, action, params)
            duration_ms = int((time.monotonic() - t0) * 1000)

            log.status = StepStatus.SUCCESS
            log.completed_at = datetime.now(timezone.utc)
            log.output_data = output
            db.commit()

            yield {
                "type": "step_completed",
                "step_index": i,
                "step_id": step_id,
                "output": output,
                "duration_ms": duration_ms,
            }

        except Exception as exc:
            duration_ms = int((time.monotonic() - t0) * 1000)
            error_msg = str(exc)

            log.status = StepStatus.FAILED
            log.completed_at = datetime.now(timezone.utc)
            log.error_message = error_msg
            db.commit()

            yield {
                "type": "step_failed",
                "step_index": i,
                "step_id": step_id,
                "error": error_msg,
                "duration_ms": duration_ms,
            }

            overall_success = False
            break

    now = datetime.now(timezone.utc)
    run.completed_at = now
    run.status = RunStatus.SUCCESS if overall_success else RunStatus.FAILED
    workflow.run_count = (workflow.run_count or 0) + 1
    workflow.last_run_at = now
    db.commit()

    yield {
        "type": "run_completed",
        "status": "success" if overall_success else "failed",
        "total_steps": len(steps),
    }
