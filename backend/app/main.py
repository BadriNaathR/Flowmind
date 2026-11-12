from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

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


# Routers registered here as sprints complete:
# from app.routers import auth, workflows, executions, integrations
# app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
# app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["integrations"])
# app.include_router(workflows.router, prefix="/api/v1/workflows", tags=["workflows"])
# app.include_router(executions.router, prefix="/api/v1", tags=["executions"])
