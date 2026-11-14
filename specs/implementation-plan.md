# Implementation Plan — FlowMind

> **Version**: 1.2  
> **Status**: Active — In Development  
> **Last Updated**: 2026-11-13  
> **Author**: Badri + Claude (Solution Architect)
>
> **v1.2 change**: Sprint 0, 1, 1b, and 2 marked complete. Dev environment note: SQLite used on TCS system (no Docker). All sprint goals and task lists remain as spec'd.

---

## 1. Build Strategy

### Philosophy
- Build **vertically** (one full feature end-to-end) not horizontally (all backend first, then all frontend)
- Every sprint ends with something **runnable and demoable**
- UI quality is built in from Sprint 1 — not added at the end
- Each feature traces back to a spec in `product-spec.md`

### Environment Setup (Before Sprint 1)
```
flowmind/
├── frontend/     # React + Vite
├── backend/      # FastAPI
├── docker-compose.yml   # PostgreSQL + Redis
└── specs/        # This folder
```

---

## 2. Sprint Plan

### Sprint 0 — Project Setup ✅ COMPLETE (2026-11-05)
**Goal**: Both apps running locally with DB connected. Nothing functional yet, just scaffolding.

> **Dev note**: `docker-compose up` replaced by SQLite on TCS system. `GET /api/v1/health` verified returning `{"status":"ok","env":"local"}`.

#### Backend Tasks
- [ ] Init FastAPI project with folder structure from `architecture.md`
- [ ] Set up `docker-compose.yml` (PostgreSQL 15 + Redis 7)
- [ ] Configure SQLAlchemy + Alembic
- [ ] Write all 5 DB models (`users`, `integrations`, `workflows`, `workflow_runs`, `workflow_run_logs`)
- [ ] Run first Alembic migration
- [ ] Set up `llm_client.py` with local TCS API + production OpenRouter switch
- [ ] Set up Celery with Redis broker
- [ ] Configure `.env.local` and `.env.production` templates
- [ ] Health check endpoint `GET /api/v1/health`

#### Frontend Tasks
- [ ] Init React + Vite project
- [ ] Install and configure Tailwind CSS
- [ ] Install shadcn/ui and init component library
- [ ] Install Framer Motion, Zustand, TanStack Query, Lucide React
- [ ] Set up global dark theme (CSS variables, design tokens)
- [ ] Set up React Router (routes structure matching all screens)
- [ ] Set up API client (`lib/api.ts`) with base URL + JWT header injection
- [ ] Set up Zustand auth store

**Sprint 0 Done When**: `docker-compose up` starts everything, health check returns 200, React app loads with dark background.

✅ **Done** — SQLite auto-creates tables on startup. Health check `{"status":"ok","env":"local"}` verified. React app running on `http://localhost:5174`.

---

### Sprint 1 — Auth + Onboarding ✅ COMPLETE (2026-11-12)
**Goal**: User can sign up with Google, connect integrations, land on dashboard.

**Spec Reference**: US-001, US-002, US-003 | Screens 2, 3

#### Backend Tasks
- [ ] `GET /api/v1/auth/google` — redirect to Google OAuth
- [ ] `GET /api/v1/auth/google/callback` — handle callback, issue JWT
- [ ] `GET /api/v1/auth/me` — return current user
- [ ] `POST /api/v1/auth/logout`
- [ ] JWT middleware (validate token on all protected routes)
- [ ] `GET /api/v1/integrations` — list integrations
- [ ] OAuth connect endpoints for Gmail, Slack, Google Sheets, Notion
- [ ] OAuth callbacks for all 4 providers
- [ ] Encrypt/decrypt OAuth tokens (AES-256)
- [ ] `DELETE /api/v1/integrations/{provider}`

#### Frontend Tasks
- [ ] Landing page (hero, features, CTA) — full premium design
- [ ] Login screen (Google OAuth button, centered card)
- [ ] Onboarding screen (4 integration cards, connect flow, OAuth popup)
- [ ] Auth redirect logic (new user → onboarding, returning → dashboard)
- [ ] Persist JWT in HTTP-only cookie / localStorage
- [ ] Protected route wrapper (redirect to login if not authed)

**Sprint 1 Done When**: Full auth + integration connect flow works end to end.

✅ **Done** — Google OAuth + email/password dual auth. Register, Login, /auth/me, Integrations CRUD all verified. Onboarding page with animated integration cards complete.

**Sprint 1b** (added): Dual auth — `POST /auth/register`, `POST /auth/login`, `password_hash` column, `google_id` nullable. `LoginPage` + `RegisterPage` built.

---

### Sprint 2 — Workflow Creation (AI Core) ✅ COMPLETE (2026-11-13)
**Goal**: User types a workflow in plain English, AI parses it, user confirms, workflow is saved.

**Spec Reference**: US-004, US-005, US-006 | Screens 5, 6, 7, 8

#### Backend Tasks
- [ ] `POST /api/v1/workflows/parse` — streaming SSE endpoint
  - Accept raw text input
  - Call Parser Agent (LangChain + `llm_client.py`)
  - Stream thinking tokens back to client
  - Return structured workflow JSON (Pydantic validated)
- [ ] Parser Agent (`agents/parser_agent.py`)
  - System prompt: workflow parser instructions
  - Extract trigger, steps, integrations
  - Detect ambiguities
  - Output: `WorkflowSchema` Pydantic model
- [ ] `POST /api/v1/workflows` — save confirmed workflow to DB
- [ ] `GET /api/v1/workflows` — list workflows
- [ ] `GET /api/v1/workflows/{id}` — get workflow detail

#### Frontend Tasks
- [ ] Create Workflow screen (beautiful large input, suggested prompts, integration badges)
- [ ] AI Processing screen (animated thinking state, streaming text typewriter effect)
- [ ] AI Confirmation screen (plain English summary, correct/confirm buttons)
- [ ] Correction flow (user types correction → re-parse → show updated confirmation)
- [ ] Visual Workflow Preview (node graph: trigger → step1 → step2 → step3)
- [ ] SSE client hook (`useWorkflowStream`) for consuming streaming response
- [ ] Zustand workflow store (draft workflow state)

**Sprint 2 Done When**: User types a workflow, sees AI thinking in real-time, confirms, sees visual flowchart, workflow saved to DB.

✅ **Done** — `POST /api/v1/workflows` calls LangChain Parser Agent, saves to DB. `GET /workflows`, `GET /workflows/{id}`, `PATCH /workflows/{id}/activate` all working. `CreateWorkflowPage` → `AIProcessingPage` → `WorkflowPreviewPage` → `DashboardPage` all built. TypeScript clean (0 errors). All endpoints verified with tests.

> **Note**: `/workflows/parse` SSE streaming and `ConfirmationPage` (AI correction flow) are planned for Sprint 2 polish — the core create/save/preview/activate flow is complete. `useWorkflowStream` hook deferred to streaming phase.

---

### Sprint 3 — Workflow Execution (5–6 days)
**Goal**: Test run and live execution work with real-time logs.

**Spec Reference**: US-007, US-008 | Screens 9

#### Backend Tasks
- [ ] `POST /api/v1/workflows/{id}/test` — streaming test run
- [ ] Execution Engine (`agents/executor.py`)
  - Run steps in sequence
  - Resolve template variables (`{{step_1.amount}}`)
  - Log each step to DB
  - Publish step events to Redis pub/sub
  - Retry logic (3x with exponential backoff)
  - Handle step failure (stop + mark failed)
- [ ] `GET /api/v1/stream/{run_id}` — SSE live log stream from Redis pub/sub
- [ ] Integration clients:
  - `integrations/gmail.py` — extract data, send email, reply, label
  - `integrations/slack.py` — send message, DM
  - `integrations/sheets.py` — append row, update cell, read row
  - `integrations/notion.py` — create page, create task
- [ ] `POST /api/v1/workflows/{id}/activate` — set status active, start Gmail poller
- [ ] Celery task: `execute_workflow(workflow_id, trigger_data)`
- [ ] Celery beat task: Gmail poller (every 60 seconds for active workflows)

#### Frontend Tasks
- [ ] Test Run screen (animated progress, real-time log panel with step-by-step updates)
- [ ] Log entry component (icon + step name + status badge + output preview)
- [ ] Success state (all green, Activate button enabled)
- [ ] Failure state (red step, error message, "describe the issue" text field)
- [ ] Activate button flow → redirect to Dashboard

**Sprint 3 Done When**: Full end-to-end works — type workflow → confirm → test → logs stream in real-time → activate.

---

### Sprint 4 — Dashboard + Workflow Management (3–4 days)
**Goal**: Dashboard is fully functional. User can manage, monitor, pause, delete workflows.

**Spec Reference**: US-009, US-010, US-011, US-012, US-013 | Screens 4, 10

#### Backend Tasks
- [ ] `PATCH /api/v1/workflows/{id}` — update name/status
- [ ] `DELETE /api/v1/workflows/{id}`
- [ ] `POST /api/v1/workflows/{id}/pause`
- [ ] `GET /api/v1/workflows/{id}/runs` — paginated run history
- [ ] `GET /api/v1/runs/{run_id}` — run detail with step logs
- [ ] `POST /api/v1/runs/{run_id}/retry`
- [ ] Failure notification: send email to user when workflow fails after retries

#### Frontend Tasks
- [ ] Dashboard (workflow cards grid, status badges, run count, last run time)
- [ ] Empty state (illustrated prompt to create first workflow)
- [ ] Quick actions per card (Pause / Run Now / Delete with confirm dialog)
- [ ] Workflow Detail screen (visual preview + run history table + expandable logs)
- [ ] Run history table (timestamp, status, duration, view logs)
- [ ] Expandable log view per run step
- [ ] Toast notifications (workflow activated, paused, deleted)

**Sprint 4 Done When**: Full dashboard experience, all CRUD operations work, run history visible.

---

### Sprint 5 — Settings + Polish (2–3 days)
**Goal**: Settings screen done. UI polished throughout. Ready for demo.

**Spec Reference**: Screen 11 | Non-functional requirements

#### Backend Tasks
- [ ] Celery scheduled task: delete runs/logs older than 30 days (runs daily at midnight)
- [ ] Rate limiting on parse endpoint (prevent abuse)
- [ ] API error handling — standardized error responses across all endpoints

#### Frontend Tasks
- [ ] Settings screen (profile, connected integrations, disconnect, notifications)
- [ ] Landing page final polish (animations, scroll effects, demo GIF/video)
- [ ] Loading skeletons on all data-fetching screens
- [ ] Error boundary components (graceful error states)
- [ ] Mobile responsiveness check across all screens
- [ ] Framer Motion page transitions (smooth route changes)
- [ ] Final dark mode polish (consistent tokens, no white flashes)

**Sprint 5 Done When**: App is fully polished, demo-ready, deployed to Vercel + Railway.

---

### Sprint 6 — Deployment + Portfolio Prep (2 days)
**Goal**: Live on the internet. Portfolio-ready.

#### Tasks
- [ ] Set up Neon PostgreSQL (production DB)
- [ ] Deploy backend to Railway (with Redis addon)
- [ ] Deploy frontend to Vercel
- [ ] Configure all production env variables
- [ ] Run Alembic migrations on production DB
- [ ] End-to-end smoke test on production
- [ ] Record a 2-minute demo video (screen recording)
- [ ] Write a 1-page project README (what it is, tech stack, architecture diagram)
- [ ] Add to portfolio/LinkedIn with live link + demo video

**Sprint 6 Done When**: Live URL works, demo video recorded, portfolio updated.

---

## 3. Total Effort Estimate

| Sprint | Focus | Days |
|--------|-------|------|
| Sprint 0 | Project Setup | 2–3 |
| Sprint 1 | Auth + Onboarding | 3–4 |
| Sprint 2 | Workflow Creation (AI Core) | 5–6 |
| Sprint 3 | Workflow Execution | 5–6 |
| Sprint 4 | Dashboard + Management | 3–4 |
| Sprint 5 | Settings + Polish | 2–3 |
| Sprint 6 | Deployment + Portfolio | 2 |
| **Total** | | **22–28 days** |

Working at ~2–3 hours/day evenings and weekends: **4–6 weeks.**

---

## 4. Development Order Rationale

| Why this order? | Reason |
|----------------|--------|
| Auth before everything | Every feature needs a logged-in user |
| AI parser before execution | Can't execute what you haven't parsed |
| Test run before live execution | Validate integration clients safely |
| Dashboard last | Needs run data to display |
| Polish in Sprint 5 | All features stable before final pass |

---

## 5. File Creation Order (Backend)

```
Sprint 0:  core/config.py → core/database.py → models/ → migrations/
           core/security.py → llm_client.py → celery_app.py

Sprint 1:  routers/auth.py → routers/integrations.py

Sprint 2:  agents/parser_agent.py → schemas/workflow.py → routers/workflows.py

Sprint 3:  integrations/gmail.py → integrations/slack.py
           integrations/sheets.py → integrations/notion.py
           agents/executor.py → tasks/workflow_tasks.py
           routers/executions.py

Sprint 4:  tasks/cleanup_task.py → (complete remaining routes)

Sprint 5:  middleware/rate_limit.py → (error handling pass)
```

---

## 6. File Creation Order (Frontend)

```
Sprint 0:  main.tsx → App.tsx → lib/api.ts → store/auth.ts
           styles/globals.css (design tokens, dark theme)

Sprint 1:  pages/LandingPage.tsx → pages/LoginPage.tsx
           pages/OnboardingPage.tsx → components/IntegrationCard.tsx

Sprint 2:  pages/CreateWorkflowPage.tsx → components/WorkflowInput.tsx
           pages/AIProcessingPage.tsx → pages/ConfirmationPage.tsx
           pages/WorkflowPreview.tsx → components/WorkflowGraph.tsx
           hooks/useWorkflowStream.ts

Sprint 3:  pages/TestRunPage.tsx → components/LogEntry.tsx
           hooks/useRunStream.ts

Sprint 4:  pages/DashboardPage.tsx → components/WorkflowCard.tsx
           pages/WorkflowDetailPage.tsx → components/RunHistoryTable.tsx

Sprint 5:  pages/SettingsPage.tsx → components/LoadingSkeleton.tsx
           (polish pass across all components)
```

---

## 7. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Gmail OAuth approval takes time | Medium | High | Apply for Gmail API scopes early in Sprint 1 |
| AI parser gives wrong output | Medium | Medium | Extensive prompt engineering + Pydantic validation |
| OpenRouter free model is too weak in production | Medium | Medium | Test early; Claude via TCS API for demos |
| Celery/Redis setup complexity | Low | Medium | Docker Compose eliminates local setup issues |
| Railway free tier limits | Low | Low | Monitor usage; upgrade only if needed |

---

*All specs complete. Ready to begin development.*  
*Start with: `Sprint 0 — Project Setup`*
