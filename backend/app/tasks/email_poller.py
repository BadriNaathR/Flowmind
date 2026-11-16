"""
Email Poller — Background Task

Runs every 5 minutes. For every active workflow with trigger.type == "email":
1. Reads Gmail for unread emails matching the trigger filter (from_email, subject_contains)
2. If a matching email is found, fires the workflow
3. Marks the email as read in Gmail so it is never processed twice

The LLM is NOT involved here. No email content leaves the user's own backend.
Data flows: Gmail API → executor → Notion/Slack. That's it.
"""
import asyncio
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.workflow import Workflow, WorkflowStatus
from app.models.workflow_run import WorkflowRun, RunStatus

logger = logging.getLogger(__name__)


def _build_gmail_query(trigger_config: dict) -> str:
    """Build a Gmail search query from trigger filter config."""
    parts = ["is:unread"]
    from_email = (trigger_config.get("from_email") or "").strip()
    subject_kw  = (trigger_config.get("subject_contains") or "").strip()
    if from_email:
        parts.append(f"from:{from_email}")
    if subject_kw:
        parts.append(f"subject:{subject_kw}")
    return " ".join(parts)


def _fetch_matching_emails(gmail_client, query: str) -> list[dict]:
    """Call Gmail API and return matching unread emails."""
    try:
        service = gmail_client._get_service()
        if service is None:
            return []
        result = service.users().messages().list(
            userId="me", q=query, maxResults=5
        ).execute()
        messages = result.get("messages", [])
        emails = []
        for msg in messages:
            detail = service.users().messages().get(
                userId="me", id=msg["id"], format="metadata",
                metadataHeaders=["From", "Subject"],
            ).execute()
            headers = {h["name"]: h["value"] for h in detail.get("payload", {}).get("headers", [])}
            emails.append({
                "id": msg["id"],
                "from": headers.get("From", ""),
                "subject": headers.get("Subject", ""),
                "snippet": detail.get("snippet", ""),
            })
        return emails
    except Exception as e:
        logger.warning(f"Email fetch error: {e}")
        return []


def _mark_as_read(gmail_client, message_id: str) -> None:
    """Remove UNREAD label so this email is never processed again."""
    try:
        service = gmail_client._get_service()
        if service is None:
            return
        service.users().messages().modify(
            userId="me",
            id=message_id,
            body={"removeLabelIds": ["UNREAD"]},
        ).execute()
    except Exception as e:
        logger.warning(f"Could not mark email as read: {e}")


def _fire_workflow(workflow_id: uuid.UUID, email: dict, db: Session) -> None:
    """Create a WorkflowRun record — the SSE stream picks it up and executes it."""
    run = WorkflowRun(
        id=uuid.uuid4(),
        workflow_id=workflow_id,
        status=RunStatus.RUNNING,
        started_at=datetime.now(timezone.utc),
        trigger_data={"source": "email_poller", "email": email},
    )
    db.add(run)
    db.commit()

    # Execute the workflow inline (no SSE — background task)
    # We import here to avoid circular imports at module level
    from app.agents.executor import execute_workflow_stream_sync
    execute_workflow_stream_sync(run.id, db)


def poll_once() -> None:
    """
    Single polling cycle. Called every N minutes by the scheduler.
    Opens its own DB session and closes it when done.
    """
    db: Session = SessionLocal()
    try:
        active_email_workflows = (
            db.query(Workflow)
            .filter(
                Workflow.status == WorkflowStatus.ACTIVE,
            )
            .all()
        )

        # Filter to email-triggered workflows
        email_workflows = [
            wf for wf in active_email_workflows
            if (wf.trigger or {}).get("type") == "email"
        ]

        if not email_workflows:
            return

        logger.info(f"Email poller: checking {len(email_workflows)} workflow(s)")

        for wf in email_workflows:
            try:
                _process_workflow(wf, db)
            except Exception as e:
                logger.error(f"Poller error for workflow {wf.id}: {e}")

    finally:
        db.close()


def _process_workflow(wf: Workflow, db: Session) -> None:
    """Check Gmail and fire workflow for each matching email."""
    from app.models.integration import Integration
    from app.core.security import decrypt_token
    from app.integrations.gmail import GmailClient

    # Load user's Gmail token
    row = (
        db.query(Integration)
        .filter(Integration.user_id == wf.user_id, Integration.provider == "gmail")
        .first()
    )
    if not row:
        logger.debug(f"Workflow {wf.id}: no Gmail integration found, skipping")
        return

    try:
        access_token  = decrypt_token(row.access_token)
        refresh_token = decrypt_token(row.refresh_token) if row.refresh_token else None
    except Exception:
        logger.warning(f"Workflow {wf.id}: could not decrypt Gmail token")
        return

    gmail = GmailClient(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=row.expires_at,
    )

    trigger_config = (wf.trigger or {}).get("config", {})
    query = _build_gmail_query(trigger_config)
    logger.info(f"Workflow '{wf.name}': Gmail query = '{query}'")

    emails = _fetch_matching_emails(gmail, query)
    if not emails:
        logger.debug(f"Workflow '{wf.name}': no matching emails")
        return

    logger.info(f"Workflow '{wf.name}': found {len(emails)} email(s), firing workflow")

    for email in emails:
        # Mark as read first so a crash can't double-fire
        _mark_as_read(gmail, email["id"])
        _fire_workflow(wf.id, email, db)


async def start_email_poller() -> None:
    """
    Async loop that calls poll_once() every 5 minutes.
    Started at app startup via FastAPI lifespan.
    """
    logger.info("Email poller started — checking every 5 minutes")
    while True:
        try:
            await asyncio.to_thread(poll_once)
        except Exception as e:
            logger.error(f"Email poller cycle error: {e}")
        await asyncio.sleep(300)  # 5 minutes
