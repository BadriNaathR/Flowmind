"""
Celery task definitions for async workflow execution.
Implemented fully in Sprint 3.
"""

from celery_app import celery_app


@celery_app.task(name="tasks.execute_workflow", bind=True, max_retries=0)
def execute_workflow(self, workflow_id: str, trigger_data: dict) -> dict:
    """
    Execute a workflow's steps in sequence.
    Logs each step to DB and streams events to Redis pub/sub.
    Implemented in Sprint 3 (agents/executor.py).
    """
    # Sprint 3: implementation goes here
    raise NotImplementedError("Implemented in Sprint 3")
