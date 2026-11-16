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


def _load_token(integration: str, user_id: uuid.UUID, db: Session) -> dict:
    from app.models.integration import Integration
    from app.core.security import decrypt_token

    row = (
        db.query(Integration)
        .filter(Integration.user_id == user_id, Integration.provider == integration)
        .first()
    )
    if not row:
        return {}
    result: dict = {}
    try:
        result["access_token"] = decrypt_token(row.access_token)
    except Exception:
        pass
    if row.refresh_token:
        try:
            result["refresh_token"] = decrypt_token(row.refresh_token)
        except Exception:
            pass
    result["expires_at"] = row.expires_at
    return result


def _enrich_params(params: dict, context: dict) -> dict:
    """
    Merge data collected from previous step outputs into the current step's params.
    This is what makes steps chain: Gmail output flows into Notion title, Slack message, etc.
    """
    enriched = dict(params)

    # Pull email data if a previous Gmail step ran
    emails = context.get("emails", [])
    if emails and isinstance(emails, list) and len(emails) > 0:
        first = emails[0]
        subject = first.get("subject", "")
        from_addr = first.get("from", "")
        snippet = first.get("snippet", "")
        summary = f"From: {from_addr}\nSubject: {subject}\n{snippet}".strip()

        enriched.setdefault("title", subject or "Email Task")
        enriched.setdefault("message", summary)
        enriched.setdefault("text", summary)
        enriched.setdefault("body", summary)

    # Pull Notion page URL if a previous Notion step ran
    if context.get("url") and "message" in enriched:
        enriched["message"] = enriched["message"] + f"\nNotion page: {context['url']}"
        enriched["text"] = enriched["message"]

    return enriched


def _get_client(integration: str, user_id: uuid.UUID, db: Session):
    token = _load_token(integration, user_id, db)
    if integration == "gmail":
        from app.integrations.gmail import GmailClient
        return GmailClient(
            access_token=token.get("access_token"),
            refresh_token=token.get("refresh_token"),
            expires_at=token.get("expires_at"),
        )
    if integration == "slack":
        from app.integrations.slack import SlackClient
        return SlackClient(bot_token=token.get("access_token"))
    if integration == "sheets":
        from app.integrations.sheets import SheetsClient
        return SheetsClient(
            access_token=token.get("access_token"),
            refresh_token=token.get("refresh_token"),
            expires_at=token.get("expires_at"),
        )
    if integration == "notion":
        from app.integrations.notion import NotionClient
        return NotionClient(api_key=token.get("access_token"))
    from app.integrations.base import GenericClient
    return GenericClient()


_TRANSIENT_ERRORS = (
    "timeout", "connection", "network", "503", "429",
    "rate limit", "temporarily", "unavailable", "ssl", "refused", "reset",
)

async def _execute_with_retry(client, action: str, params: dict, max_retries: int = 3) -> tuple[dict, int]:
    """
    Run client.execute with exponential backoff retry on transient failures.
    Returns (output, attempts_used).  attempts_used=1 means it worked first try.
    """
    last_exc: Exception = Exception("unknown")
    for attempt in range(max_retries):
        try:
            output = await asyncio.to_thread(client.execute, action, params)
            return output, attempt + 1
        except Exception as exc:
            last_exc = exc
            is_transient = any(word in str(exc).lower() for word in _TRANSIENT_ERRORS)
            if not is_transient or attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)   # 1 s, 2 s, 4 s
    raise last_exc


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
    # Accumulates output data from each step so later steps can use it
    run_context: dict = {}

    for i, step in enumerate(steps):
        step_id = step.get("step_id", f"step_{i + 1}")
        integration = step.get("integration", "internal")
        action = step.get("action", "execute")
        params = _enrich_params(step.get("params", {}), run_context)

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
            client = _get_client(integration, workflow.user_id, db)
            output, attempts = await _execute_with_retry(client, action, params)
            duration_ms = int((time.monotonic() - t0) * 1000)

            log.status = StepStatus.SUCCESS
            log.completed_at = datetime.now(timezone.utc)
            log.output_data = output
            log.retry_count = attempts - 1
            db.commit()

            if isinstance(output, dict):
                run_context.update({k: v for k, v in output.items() if not k.startswith("_")})

            yield {
                "type": "step_completed",
                "step_index": i,
                "step_id": step_id,
                "output": output,
                "duration_ms": duration_ms,
                "retries": attempts - 1,
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


def execute_workflow_stream_sync(run_id: uuid.UUID, db: Session) -> None:
    """
    Synchronous version of the executor for the email poller background task.
    Same logic — no SSE yielding, just runs the steps and saves results to DB.
    """
    import logging
    logger = logging.getLogger(__name__)

    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        return

    workflow = run.workflow
    steps: list[dict] = workflow.steps or []
    overall_success = True
    run_context: dict = {}

    # Seed context with trigger email data if poller provided it
    trigger_email = (run.trigger_data or {}).get("email", {})
    if trigger_email:
        run_context.update({k: v for k, v in trigger_email.items() if k != "id"})

    for i, step in enumerate(steps):
        step_id = step.get("step_id", f"step_{i + 1}")
        integration = step.get("integration", "internal")
        action = step.get("action", "execute")
        params = _enrich_params(step.get("params", {}), run_context)

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

        t0 = time.monotonic()
        try:
            client = _get_client(integration, workflow.user_id, db)
            output = client.execute(action, params)
            duration_ms = int((time.monotonic() - t0) * 1000)

            log.status = StepStatus.SUCCESS
            log.completed_at = datetime.now(timezone.utc)
            log.output_data = output
            db.commit()

            if isinstance(output, dict):
                run_context.update({k: v for k, v in output.items() if not k.startswith("_")})

            logger.info(f"[poller] step {i + 1} ({integration}) SUCCESS in {duration_ms}ms")

        except Exception as exc:
            duration_ms = int((time.monotonic() - t0) * 1000)
            log.status = StepStatus.FAILED
            log.completed_at = datetime.now(timezone.utc)
            log.error_message = str(exc)
            db.commit()
            logger.error(f"[poller] step {i + 1} ({integration}) FAILED: {exc}")
            overall_success = False
            break

    now = datetime.now(timezone.utc)
    run.completed_at = now
    run.status = RunStatus.SUCCESS if overall_success else RunStatus.FAILED
    workflow.run_count = (workflow.run_count or 0) + 1
    workflow.last_run_at = now
    db.commit()

    logger.info(f"[poller] workflow '{workflow.name}' run {run_id} → {run.status}")
