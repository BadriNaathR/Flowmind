# AI Workflow Automation Platform — Project Progress

> **Purpose**: This file tracks all decisions, requirements, and progress for the portfolio project.
> Resume any session by sharing this file with Claude and saying "resume from progress.md"

---

## Project Summary

**Product Name**: FlowMind
**Type**: AI Workflow Automation Platform
**Goal**: Portfolio project for job search targeting product-based startups

### One-Line Description
> A platform where non-technical startup founders describe any workflow in plain English and AI agents automatically build, run, and manage the automation — no code, no configuration required.

---

## About the Developer

- **Role**: Full Stack AI Engineer
- **Experience**: 2 years
- **Achievements**: 2 National Hackathon wins (TCS — Credit Card Dispute, NVIDIA — Flood Prediction & Evacuation)
- **Current work**: Advanced RAG applications and GenAI
- **Target**: Product-based startup companies
- **Goal**: 1 strong flagship portfolio project (2 hackathon projects being built separately)

---

## Key Decisions Made

| # | Decision | Reason |
|---|----------|--------|
| 1 | Dropped SDD/developer tool idea | Better to build product-facing AI, not developer tooling |
| 2 | Chose AI Workflow Automation Platform | Shows multi-agent system design, full-stack depth, real user value |
| 3 | Primary user = Non-technical startup founders | Forces AI to do heavy lifting; most impressive demo |
| 4 | Generic platform (not email-specific) | Architecture must support ANY workflow, not just email |
| 5 | MVP use case = Email automation | Clear, demonstrable, connects to other use cases naturally |
| 6 | Phase 2 = Operations tracking | Natural extension after email |
| 7 | Phase 3 = Invoices & expenses | Natural extension after operations |

---

## Phase Status

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Brainstorming & Idea Finalization | ✅ Done | |
| 2. Requirements Gathering | ✅ Done | |
| 3. Writing Specifications | ✅ Done | `specs/product-spec.md` v1.1 — all 15 US with Given/When/Then |
| 4. System Architecture | ✅ Done | `specs/architecture.md` |
| 5. Database & API Design | ✅ Done | `specs/api-spec.md` |
| 6. Implementation Planning | ✅ Done | `specs/implementation-plan.md` |
| 6a. Test Plan | ✅ Done | `specs/test-plan.md` — 90 unit, 34 integration, 10 E2E tests defined |
| 7. Development & Testing | 🔄 In Progress | Sprint 0 ✅ · Sprint 1 ✅ · Sprint 1b ✅ · Sprint 2 ✅ · Sprint 3 ✅ complete — Sprint 4 next |

---

## Requirements (In Progress)

### Users
- **Primary**: Non-technical startup founders / ops teams
- **Behavior**: They describe what they want in plain English — no coding, no configuration

### Core Use Cases (MVP Priority Order)
1. **Email Automation** ← MVP focus
   - Auto-categorize incoming emails
   - Draft and send replies
   - Extract action items
   - Route emails to right person/tool
2. **Operations Tracking** ← Phase 2
   - Team task updates
   - Status reporting
   - Meeting notes → action items
3. **Invoice & Expense Management** ← Phase 3
   - Extract data from invoice emails
   - Log to spreadsheet
   - Payment reminders

### Core Platform Behavior (All Phases)
- User describes workflow in plain English
- AI understands, decomposes into steps, selects tools/integrations
- AI builds and runs the workflow automatically
- User sees real-time execution logs (what the AI is doing)
- User can edit, pause, or delete workflows

### Design Principles (Non-Negotiable)
- UI/UX gets **equal weight** to engineering — first impression must impress
- Target quality: Vercel / Linear / Notion level polish
- Dark mode as default
- Smooth animations and real-time visual feedback
- Consistent design system throughout the entire app
- Beautiful onboarding flow (not just a form)
- Workflow visualization must look designed, not auto-generated

### User Journey (Confirmed)
1. **Sign Up & Connect Tools** — Google auth → connect Gmail, Slack, Notion, Google Sheets via OAuth in one click
2. **Describe the Workflow** — Single, beautifully designed input area, type in plain English
3. **AI Confirms Understanding** — AI shows what it understood, step by step, in plain English. User confirms or corrects
4. **Visual Workflow Preview** — Clean flowchart visualization. User approves
5. **Test Run** — Run on real/sample data, see real-time execution logs
6. **Activate** — One click, workflow goes live
7. **Dashboard** — All workflows, run history, success/failure, pause/delete

### MVP Integrations (Confirmed)
| Integration | Purpose |
|-------------|---------|
| Gmail | Email trigger + send/reply |
| Slack | Notifications + messages |
| Google Sheets | Data logging |
| Notion | Task/note creation |

**Phase 2 integrations** (after MVP): WhatsApp, Jira, Calendly, HubSpot

### Cost (Confirmed)
- All 4 MVP integrations: Free
- LLM API: ~$5–20 total for portfolio/testing
- Hosting: Free tier (Vercel/Railway/Render)
- Total cost to build and demo: Under $20

### Open Requirements (Resolved)
- [x] MVP integrations list — confirmed above
- [x] User journey — confirmed above
- [x] UI/UX standard — Vercel/Linear/Notion level polish
- [ ] What happens when AI misunderstands? → handle in Specifications phase
- [ ] Multi-user support in MVP? → handle in Specifications phase

---

## Next Session Resume Point

**Where we stopped**: All specs + test plan complete. All 15 user stories have full Given/When/Then acceptance criteria.

**All spec files**:
- `specs/product-spec.md` v1.1 — 15 user stories with Given/When/Then acceptance criteria
- `specs/architecture.md` — System architecture, tech stack, folder structure
- `specs/api-spec.md` — Full database schema (5 tables) + 20 API endpoints
- `specs/implementation-plan.md` — 6 sprints, 22–28 days, file creation order
- `specs/test-plan.md` — 90 unit tests, 34 integration tests, 10 E2E tests (Playwright)

**Reference files** (for learning/portfolio):
- `sdlc-guide.html` — Full SDLC encyclopedia (history, Agile, Scrum, SDD)
- `sdlc-models.html` — Deep dive on all 8 SDLC models (Waterfall → SDD)

## Sprint 0 — ✅ COMPLETE (2026-11-05)

#### Backend ✅
- [x] FastAPI project scaffolded (`flowmind/backend/`)
- [x] `docker-compose.yml` — PostgreSQL 15 + Redis 7 (ready; Docker not installed on dev machine)
- [x] SQLAlchemy 2.0 + Alembic setup
- [x] 5 DB models: `users`, `integrations`, `workflows`, `workflow_runs`, `workflow_run_logs`
- [x] First Alembic migration (`0001_initial_schema.py`) — 3 PG enums + 5 tables + indexes
- [x] `llm_client.py` — TCS GenAI Lab (local) + OpenRouter (production) switch via `APP_ENV`
- [x] Celery + Redis broker (`celery_app.py`)
- [x] `.env` created with real JWT secret + Fernet encryption key
- [x] `GET /api/v1/health` → `{"status": "ok", "env": "local"}` ✅ verified

#### Frontend ✅
- [x] React 18 + Vite 5 init (`flowmind/frontend/`)
- [x] Tailwind CSS with custom FlowMind design tokens
- [x] Framer Motion, Zustand, TanStack Query, Lucide React, Recharts
- [x] Global dark theme (CSS variables: `--bg: #0c0f1a`, `--accent: #38bdf8`)
- [x] React Router v6 — all 11 routes with ProtectedRoute wrapper
- [x] `lib/api.ts` — axios client with JWT header + 401 redirect
- [x] Zustand auth store with `hydrate()` from localStorage
- [x] Frontend dev server: `http://localhost:5174` ✅ verified

#### DB Setup (pending Docker or local PostgreSQL)
- [ ] `docker-compose up` — needs Docker Desktop installation
- [ ] `alembic upgrade head` — run after PostgreSQL is available
- [ ] Alternative: install PostgreSQL locally OR use Supabase free tier

## Sprint 1 — ✅ COMPLETE (2026-11-12)

#### Backend ✅
- [x] `app/schemas/auth.py` — `UserOut`, `TokenOut` Pydantic schemas
- [x] `app/schemas/integration.py` — `IntegrationOut`, `ConnectPayload` schemas
- [x] `app/dependencies.py` — `get_current_user` JWT dependency (HTTPBearer → decode → DB lookup)
- [x] `app/routers/auth.py` — `GET /auth/google` (OAuth redirect) + `GET /auth/google/callback` (exchange code, upsert user, return JWT) + `GET /auth/me`
- [x] `app/routers/integrations.py` — `GET /integrations` (list all 4) + `POST /integrations/{provider}/connect` (mock OAuth, stores placeholder) + `DELETE /integrations/{provider}`
- [x] `app/main.py` updated — routers registered at `/api/v1/auth` and `/api/v1/integrations`

#### Frontend ✅
- [x] `src/pages/AuthCallbackPage.tsx` — reads `?token=` from Google redirect, stores JWT, calls `/auth/me`, navigates to onboarding
- [x] `src/pages/OnboardingPage.tsx` — full implementation: 4 integration cards (Gmail, Slack, Sheets, Notion), animated connect states, radial glow, staggered entry animation, "Continue to Dashboard" appears after first connect
- [x] `src/store/auth.ts` — added `fetchMe()` action
- [x] `src/App.tsx` — added `/auth/callback` route

#### Sprint 1b — Added (2026-11-12): Dual Auth
- [x] `app/models/user.py` — `google_id` made nullable, `password_hash` column added
- [x] `alembic/versions/0002_add_password_auth.py` — migration for the two new columns
- [x] `app/core/security.py` — `hash_password()` / `verify_password()` using bcrypt (passlib)
- [x] `app/schemas/auth.py` — `LoginPayload`, `RegisterPayload` (with EmailStr)
- [x] `app/routers/auth.py` — `POST /auth/register`, `POST /auth/login`; Google callback links accounts if same email exists; passes `?onboard=0/1` to frontend
- [x] `frontend/src/pages/LoginPage.tsx` — email+password form + "or" divider + Google button + link to Register
- [x] `frontend/src/pages/RegisterPage.tsx` — name/email/password with strength hint, navigates to /onboarding on success
- [x] `frontend/src/App.tsx` — `/register` route added
- [x] `frontend/src/pages/AuthCallbackPage.tsx` — reads `?onboard` flag, routes new users → /onboarding, returning users → /dashboard

#### Pending (needs DB)
- [ ] `alembic upgrade head` — once PostgreSQL is available (Docker or Supabase)
- [ ] Add real `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` to `.env` for live Google OAuth

## Sprint 2 — ✅ COMPLETE (2026-11-13)

#### Backend ✅
- [x] `app/agents/workflow_agent.py` — LangChain `ChatOpenAI` Parser Agent (TCS local → OpenRouter production)
- [x] `app/schemas/workflow.py` — `WorkflowCreate`, `WorkflowOut`, `WorkflowListItem` Pydantic schemas
- [x] `app/routers/workflows.py` — `POST /workflows` (LLM + save), `GET /workflows`, `GET /workflows/{id}`, `PATCH /workflows/{id}/activate`
- [x] All endpoints verified with tests (mocked LLM)

#### Frontend ✅
- [x] `CreateWorkflowPage` — large NL textarea, 4 example prompts, ⌘↵ shortcut, animated generate button
- [x] `AIProcessingPage` — 4 animated stages, calls `POST /api/v1/workflows`, progress dots, error state
- [x] `WorkflowPreviewPage` — trigger card + step cards with integration badges + Activate button
- [x] `DashboardPage` — real workflow list from API, status badges, empty state CTA, greeting
- [x] TypeScript: 0 errors

#### Pending (Sprint 2 polish — deferred to after Sprint 3)
- [ ] `POST /api/v1/workflows/parse` — separate SSE streaming endpoint for real-time AI thinking
- [ ] `ConfirmationPage` — AI shows understanding, user confirms or corrects
- [ ] Correction/re-parse flow (US-014)
- [ ] `useWorkflowStream` SSE hook

## Sprint 3 — ✅ COMPLETE (2026-11-13)

#### Backend ✅
- [x] `app/integrations/gmail.py` — simulated Gmail client (read, send, reply, label, extract)
- [x] `app/integrations/slack.py` — simulated Slack client (post, DM)
- [x] `app/integrations/sheets.py` — simulated Sheets client (append, read, update)
- [x] `app/integrations/notion.py` — simulated Notion client (create, update, search)
- [x] `app/integrations/base.py` — GenericClient fallback (http, internal)
- [x] `app/agents/executor.py` — async generator, runs steps via asyncio.to_thread, logs to DB
- [x] `app/routers/executions.py` — `POST /workflows/{id}/test` + `GET /stream/{run_id}` SSE
- [x] `app/dependencies.py` — `get_current_user_query` for EventSource JWT auth (query param)
- [x] SSL fix: `httpx.Client(verify=False)` for TCS corporate endpoint in workflow_agent.py

#### Frontend ✅
- [x] `src/hooks/useRunStream.ts` — EventSource hook with status tracking
- [x] `src/components/LogEntry.tsx` — step card: spinner→check/X, expandable JSON output
- [x] `src/pages/TestRunPage.tsx` — progress bar, live log stream, Activate button on success
- [x] `WorkflowPreviewPage` — added "Test Run" button between Regenerate and Activate

**Next action**: Sprint 4 — Dashboard + Workflow Management
- Execution engine (`agents/executor.py`) — run steps in sequence, log each step
- Integration clients: `gmail.py`, `slack.py`, `sheets.py`, `notion.py`
- `POST /api/v1/workflows/{id}/test` — test run (SSE streaming logs)
- `GET /api/v1/stream/{run_id}` — live log stream
- `POST /api/v1/workflows/{id}/activate` — start trigger watcher
- Celery task: `execute_workflow(workflow_id, trigger_data)`
- `TestRunPage` — real-time log panel with step-by-step updates

---

## Notes & Ideas (Parking Lot)

- Project name TBD — brainstorm later
- Consider showing AI "thinking" in real-time (agent reasoning visible to user) — very impressive for demos
- Workflow versioning could be a differentiator (traceability!)
- Could position as "AI-native Zapier" in portfolio description

---

*Last updated: 2026-11-13 | Session 6 — Sprint 2 complete. LangChain Parser Agent + Workflow CRUD backend + 4 frontend pages built. Sprint 3 (Execution Engine) is next.*
