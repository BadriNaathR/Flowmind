import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine, _is_sqlite
from app.routers import auth, integrations, workflows, executions

logger = logging.getLogger(__name__)

# SQLite (dev): auto-create all tables on startup — no Alembic needed
if _is_sqlite:
    import app.models  # noqa: F401 — registers all models on Base.metadata
    Base.metadata.create_all(engine)
    # Add new columns to existing tables if they don't exist yet
    from sqlalchemy import text
    with engine.connect() as _conn:
        for _col, _type in [("confidence", "INTEGER"), ("confidence_reason", "TEXT")]:
            try:
                _conn.execute(text(f"ALTER TABLE workflows ADD COLUMN {_col} {_type}"))
                _conn.commit()
            except Exception:
                pass  # column already exists


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start email poller as a background task
    from app.tasks.email_poller import start_email_poller
    poller_task = asyncio.create_task(start_email_poller())
    logger.info("Email poller background task started")
    yield
    # Shutdown — cancel the poller gracefully
    poller_task.cancel()
    try:
        await poller_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="FlowMind API",
    description="AI Workflow Automation Platform",
    version="0.1.0",
    docs_url="/api/docs" if settings.DEBUG else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "env": settings.APP_ENV}


# Sprint 1 — Auth + Integrations
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["integrations"])

# Sprint 2 — Workflow CRUD + AI creation
app.include_router(workflows.router, prefix="/api/v1/workflows", tags=["workflows"])

# Sprint 3 — Execution engine + SSE stream
app.include_router(executions.router, prefix="/api/v1", tags=["executions"])
