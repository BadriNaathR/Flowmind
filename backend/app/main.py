from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine, _is_sqlite
from app.routers import auth, integrations, workflows, executions

# SQLite (dev): auto-create all tables on startup — no Alembic needed
if _is_sqlite:
    import app.models  # noqa: F401 — registers all models on Base.metadata
    Base.metadata.create_all(engine)

app = FastAPI(
    title="FlowMind API",
    description="AI Workflow Automation Platform",
    version="0.1.0",
    docs_url="/api/docs" if settings.DEBUG else None,
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
