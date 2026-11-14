# System Architecture — FlowMind

> **Version**: 1.1  
> **Status**: Active  
> **Last Updated**: 2026-11-13  
> **Author**: Badri + Claude (Solution Architect)
>
> **v1.1 change**: Local DB changed from Docker + PostgreSQL to **SQLite** (TCS dev environment blocks external ports; Docker not available). All other architecture decisions unchanged.

---

## 1. Architecture Overview

FlowMind is built as a **modern full-stack web application** with a multi-agent AI backbone. The architecture separates concerns cleanly into four layers:

```
┌─────────────────────────────────────────┐
│              Frontend (UI)              │  React + Vite + Tailwind
├─────────────────────────────────────────┤
│              Backend API                │  FastAPI (Python)
├─────────────────────────────────────────┤
│           AI Agent Layer                │  Multi-Agent System (Claude API)
├─────────────────────────────────────────┤
│      Data + Integration Layer           │  PostgreSQL + Redis + OAuth Services
└─────────────────────────────────────────┘
```

---

## 2. Tech Stack Decision

### 2.1 Frontend
| Technology | Choice | Reason |
|-----------|--------|--------|
| Framework | **React + Vite** | Familiar stack, fast dev server, no SSR needed |
| Styling | **Tailwind CSS** | Rapid UI development, consistent design system |
| UI Components | **shadcn/ui** | Premium headless components, fully customizable |
| Animations | **Framer Motion** | Smooth, production-quality animations |
| State Management | **Zustand** | Lightweight, simple, no boilerplate |
| Data Fetching | **TanStack Query** | Server state, caching, real-time sync |
| Real-time | **Server-Sent Events (SSE)** | Stream AI processing + execution logs to UI via native `EventSource` |
| Icons | **Lucide React** | Clean, consistent icon set |
| Charts | **Recharts** | Workflow run history visualization |

### 2.2 Backend
| Technology | Choice | Reason |
|-----------|--------|--------|
| Framework | **FastAPI (Python)** | Async, fast, perfect for AI workloads, great typing |
| Auth | **NextAuth.js** (frontend) + **JWT** | Google OAuth, session management |
| Task Queue | **Celery + Redis** | Async workflow execution, retries, scheduling |
| Workflow Engine | **Custom Python** | Purpose-built, full control |
| ORM | **SQLAlchemy + Alembic** | Robust DB management, migrations |

### 2.3 AI Layer
| Technology | Choice | Reason |
|-----------|--------|--------|
| LLM Client | **langchain_openai ChatOpenAI** | OpenAI-compatible — works with TCS API locally and OpenRouter in production |
| Local LLM | **TCS GenAI Lab** (`genailab.tcs.in`) | Internal API, Claude Sonnet-based, free for dev |
| Production LLM | **OpenRouter** (free tier models) | Zero cost, provider-agnostic, easy swap |
| Abstraction | **`llm_client.py`** (single file) | One file controls all LLM access — swap provider by changing `.env` only |
| Agent Framework | **Custom (Python)** | Full control over agent behavior and logging |
| Structured Output | **Pydantic** | Reliable structured workflow generation |
| Streaming | **LangChain streaming + SSE** | Real-time AI thinking shown to user |

### 2.4 Data & Infrastructure
| Technology | Choice | Reason |
|-----------|--------|--------|
| Primary DB | **PostgreSQL** | Relational, reliable, great for structured workflow data |
| Local DB | **SQLite** (file: `flowmind_dev.db`) | TCS dev system: Docker not available, external Postgres ports blocked. SQLite requires zero setup. Switch to Postgres at deploy time. |
| Production DB | **Supabase** (free tier) | Serverless PostgreSQL, connection pooler on port 6543, just a connection string |
| Cache / Queue | **Redis** | Task queue (Celery), session cache, real-time pub/sub |
| Local Redis | **Docker Compose (redis:7)** | Same docker-compose.yml as postgres (used on OpenRouter system) |
| Production Redis | **Railway addon** | Free tier, same platform as backend |
| File Storage | **None in MVP** | No files stored — only metadata |
| Hosting (Frontend) | **Vercel** | Free tier, instant deploy, perfect for React + Vite |
| Hosting (Backend) | **Railway** | Free tier, supports Python + PostgreSQL + Redis |
| Log Storage | **PostgreSQL** | Workflow run logs stored in DB, 30-day TTL auto-delete |

---

## 3. System Components

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                               │
│  React + Vite App                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  Auth Pages │  │  Dashboard   │  │  Workflow Creator    │ │
│  │  (Login /   │  │  (List,      │  │  (Input → AI State   │ │
│  │  Onboarding)│  │  Status,     │  │  → Confirm → Preview │ │
│  │             │  │  History)    │  │  → Test → Activate)  │ │
│  └─────────────┘  └──────────────┘  └──────────────────────┘ │
│                         ↕ HTTPS + SSE                         │
├──────────────────────────────────────────────────────────────┤
│                       BACKEND API                             │
│  FastAPI                                                      │
│  ┌────────────┐ ┌──────────────┐ ┌──────────────────────────┐│
│  │ Auth       │ │ Workflow     │ │ Execution                ││
│  │ Router     │ │ Router       │ │ Router                   ││
│  │            │ │ (CRUD,       │ │ (Trigger, Run,           ││
│  │ /auth/*    │ │ Parse, Test) │ │ Logs, Status)            ││
│  └────────────┘ └──────────────┘ └──────────────────────────┘│
│                              ↕                                │
├──────────────────────────────────────────────────────────────┤
│                      AI AGENT LAYER                           │
│  ┌─────────────────┐    ┌────────────────────────────────────┐│
│  │  Parser Agent   │    │      Execution Agent               ││
│  │                 │    │                                    ││
│  │ • Parse NL text │    │ • Execute each workflow step       ││
│  │ • Extract       │    │ • Call integration APIs            ││
│  │   trigger +     │    │ • Handle retries                   ││
│  │   actions       │    │ • Stream logs in real-time         ││
│  │ • Detect        │    │ • Report success/failure           ││
│  │   ambiguities   │    └────────────────────────────────────┘│
│  │ • Generate      │                                          │
│  │   workflow JSON │                                          │
│  └─────────────────┘                                          │
│                              ↕                                │
├──────────────────────────────────────────────────────────────┤
│               DATA + INTEGRATION LAYER                        │
│  ┌──────────────┐ ┌───────┐ ┌────────────────────────────────┐│
│  │  PostgreSQL  │ │ Redis │ │  Integration Clients           ││
│  │              │ │       │ │                                ││
│  │  • Users     │ │ •Task │ │  Gmail API                     ││
│  │  • Workflows │ │  Queue│ │  Slack API                     ││
│  │  • Runs      │ │ •Cache│ │  Google Sheets API             ││
│  │  • Logs      │ │ •PubSub│ │  Notion API                   ││
│  │  • Tokens    │ │       │ │                                ││
│  └──────────────┘ └───────┘ └────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

---

## 4. AI Agent Architecture (Multi-Agent Detail)

FlowMind uses **two specialized agents** that work in sequence:

### Agent 1: Parser Agent
**Trigger**: User submits natural language workflow description  
**Model**: Claude claude-sonnet-5-5  
**Mode**: Streaming (user sees AI thinking in real-time)

```
Input:  "When I get an email with an invoice, extract amount 
         and add to my sheet and ping Slack"

Process:
  1. Understand intent
  2. Identify trigger (email received + filter)
  3. Identify actions (extract → sheets → slack)
  4. Map to available integrations
  5. Detect ambiguities
  6. Generate structured workflow JSON

Output: WorkflowSchema (Pydantic model)
{
  trigger: { type, filters },
  steps: [ { step_id, type, integration, action, params, depends_on } ],
  ambiguities: [ { question, context } ]  // if any
}
```

**Streaming behavior**: As the agent processes, it streams tokens back to the frontend:
- Frontend shows the "AI is thinking" screen with live text

### Agent 2: Execution Agent
**Trigger**: Workflow activated OR test run requested  
**Model**: Python execution engine (no LLM needed for execution)  
**Mode**: Async via Celery task + SSE stream to frontend

```
Process per workflow run:
  1. Fetch workflow steps from DB
  2. For each step (in order):
     a. Resolve input params (from previous step outputs or trigger data)
     b. Call the integration API
     c. Log: timestamp, input, output, status
     d. Stream log entry to frontend via SSE
     e. On failure: retry up to 3x with backoff
     f. On total failure: mark step failed, stop, notify user
  3. Mark run as: Success / Partial / Failed
  4. Store run record in DB
```

---

## 5. Workflow Data Flow

### 5.1 Creating a Workflow
```
User types description
       ↓
POST /api/workflows/parse
       ↓
Parser Agent (Claude) → streams thinking to UI
       ↓
Returns WorkflowSchema JSON
       ↓
UI shows AI Confirmation screen
       ↓
User confirms (or corrects → re-parse)
       ↓
UI shows Visual Workflow Preview
       ↓
User clicks "Test" → POST /api/workflows/test
       ↓
Execution Agent runs (SSE streams logs to UI)
       ↓
User clicks "Activate" → POST /api/workflows/activate
       ↓
Workflow stored in DB with status: ACTIVE
       ↓
Gmail watcher starts (polling every 60 seconds)
```

### 5.2 Executing a Workflow (Triggered)
```
Gmail Poller detects new matching email
       ↓
Celery task created: execute_workflow(workflow_id, trigger_data)
       ↓
Execution Agent runs steps in sequence
       ↓
Each step logs to DB + publishes to Redis pub/sub
       ↓
SSE endpoint streams log to frontend (if user is watching)
       ↓
Final status written to workflow_runs table
       ↓
If failed: send failure notification email to user
```

---

## 6. Integration Architecture

All integrations follow a **common adapter pattern**:

```python
class IntegrationAdapter:
    def authenticate(self, oauth_token) -> bool
    def execute_action(self, action_type, params) -> ActionResult
    def validate_params(self, action_type, params) -> ValidationResult
```

Each integration (Gmail, Slack, Sheets, Notion) implements this interface. This makes it trivially easy to add new integrations in Phase 2.

### OAuth Token Storage
- OAuth tokens stored **encrypted** in PostgreSQL
- Encryption key stored in environment variable (never in code)
- Tokens refreshed automatically before expiry

---

## 7. Real-time Architecture (SSE)

For real-time log streaming (AI thinking + execution logs), FlowMind uses **Server-Sent Events**:

```
Client                    FastAPI Backend              Redis
  |                            |                         |
  |-- GET /api/stream/{run_id} |                         |
  |                            |-- SUBSCRIBE run:{id} ---|
  |                            |                         |
  |          (Execution Agent publishes step logs)        |
  |                            |<-- step log event ------|
  |<-- SSE: data: {...step} ---|                         |
  |<-- SSE: data: {...step} ---|                         |
  |<-- SSE: data: {done} ------|                         |
  |-- close connection         |                         |
```

---

## 8. Security Architecture

| Concern | Solution |
|---------|---------|
| Authentication | Google OAuth 2.0 via NextAuth.js |
| Session | JWT tokens, 7-day expiry, HTTP-only cookies |
| OAuth tokens (Gmail, Slack etc.) | AES-256 encrypted at rest in PostgreSQL |
| API authorization | Every API route validates JWT, checks resource ownership |
| Email content | Never stored permanently — only extracted fields saved |
| Environment secrets | Stored in `.env`, never committed to git |
| CORS | Restricted to frontend domain only |

---

## 9. Project Folder Structure

```
flowmind/
├── frontend/                    # React + Vite App
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── onboarding/
│   │   ├── dashboard/
│   │   ├── workflow/
│   │   │   ├── create/
│   │   │   └── [id]/
│   │   └── settings/
│   ├── components/
│   │   ├── ui/                  # shadcn base components
│   │   ├── workflow/            # Workflow-specific components
│   │   └── layout/              # Nav, sidebar, etc.
│   ├── lib/
│   │   ├── api.ts               # API client
│   │   └── auth.ts              # NextAuth config
│   └── store/                   # Zustand stores
│
├── backend/                     # FastAPI App
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── workflows.py
│   │   │   ├── executions.py
│   │   │   └── integrations.py
│   │   ├── agents/
│   │   │   ├── parser_agent.py  # Claude-powered NL parser
│   │   │   └── executor.py      # Workflow execution engine
│   │   ├── integrations/
│   │   │   ├── gmail.py
│   │   │   ├── slack.py
│   │   │   ├── sheets.py
│   │   │   └── notion.py
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   └── core/
│   │       ├── config.py
│   │       ├── security.py
│   │       └── database.py
│   ├── celery_app.py            # Celery + Redis config
│   └── tasks/
│       └── workflow_tasks.py    # Async workflow execution tasks
│
└── docs/                        # This specs folder
    ├── product-spec.md
    ├── architecture.md
    └── api-spec.md              # Coming next
```

---

## 10. Architecture Decisions & Rationale

| Decision | Chosen | Rejected | Reason |
|----------|--------|----------|--------|
| Frontend framework | React + Vite | Next.js, Vue | Developer already knows React; SSR not needed for this app; simpler Vite setup |
| LLM client | langchain_openai ChatOpenAI | LiteLLM | Dev already uses this; OpenAI-compatible format works for both TCS API and OpenRouter |
| LLM abstraction | Single `llm_client.py` | Direct SDK calls everywhere | One file to change when switching providers — clean separation |
| Local LLM | TCS GenAI Lab API | Anthropic direct | Free internal access, no cost during development |
| Production LLM | OpenRouter (free models) | Anthropic API | Zero cost for portfolio demo |
| Local DB (dev) | SQLite | Docker Compose, Local PostgreSQL | TCS system: Docker unavailable, external Postgres ports blocked by firewall. SQLite = zero setup, identical SQLAlchemy ORM code. |
| Production DB | Supabase (free) | Neon, Railway PostgreSQL | Free tier PostgreSQL, easy connection string, no server to manage. Run `alembic upgrade head` at deploy time. |
| Backend language | Python (FastAPI) | Node.js | AI libraries, Celery, LangChain all Python-native |
| Agent framework | Custom Python | LangChain Agents | Full control, no abstraction overhead, cleaner portfolio code |
| Real-time | SSE | WebSocket | SSE is simpler, one-directional, perfect for log streaming |
| Task queue | Celery + Redis | BullMQ, SQS | Python-native, Redis doubles as cache and pub/sub |
| DB engine | PostgreSQL | SQLite | Concurrent writes safe, production-grade, Neon free tier |
| Hosting | Vercel + Railway | AWS, GCP | Free tier, zero DevOps, deploy in minutes |

---

*Next Phase: Database & API Design*  
*Spec file: `specs/api-spec.md`*
