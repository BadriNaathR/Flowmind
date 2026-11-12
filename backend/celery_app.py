from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "flowmind",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["tasks.workflow_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    # Retry policy defaults (overridden per task where needed)
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    # Beat schedule for cleanup task (Sprint 4+)
    beat_schedule={},
)
