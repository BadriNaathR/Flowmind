# FlowMind

**AI-powered workflow automation — describe it in plain English, FlowMind builds and runs it.**

FlowMind connects your tools (Gmail, Slack, Google Sheets, Notion) and lets Claude AI turn a plain-English sentence into a live, running automation — no code, no drag-and-drop builders.

---

## What It Does

You type:
> *"When I get an invoice email from accounts@vendor.com, create a Notion task and notify my Slack channel"*

FlowMind:
1. Sends that description to Claude AI
2. AI decomposes it into executable steps with a confidence score
3. You review the steps and approve before anything runs
4. Steps execute in real time — you watch each one complete with live streaming
5. Output from each step (email subject, Notion URL) automatically flows into the next

The email poller checks your Gmail every 5 minutes and fires the workflow automatically when a matching email arrives.

---

## Features

| Feature | Details |
|---|---|
| **AI workflow generation** | Plain-English → structured steps via Claude AI |
| **AI confidence score** | 0–100 score with reason — warns when AI is uncertain |
| **Human approval gate** | Shows exactly what will happen before execution |
| **Real-time SSE streaming** | Watch each step execute live in the browser |
| **Step chaining** | Email subject → Notion title → Slack message, automatically |
| **Retry logic** | 3 attempts with exponential backoff on transient failures |
| **Email poller** | Checks Gmail every 5 min, fires workflows automatically |
| **Trigger filters** | Only fire for emails from a specific sender or subject keyword |
| **4 real integrations** | Gmail, Slack, Google Sheets, Notion — real API calls, not mocks |
| **Run history** | Every past run with expandable per-step logs and output |
| **Pause / Resume / Delete** | Full workflow lifecycle management |
| **Google OAuth + email auth** | Two auth methods, JWT sessions |

---

## Tech Stack

### Backend
- **Python 3.12** · **FastAPI** · **SQLAlchemy 2** · **Pydantic v2**
- **SQLite** (development) · **PostgreSQL/Supabase** (production)
- **openai** library — direct API calls to any OpenAI-compatible LLM endpoint
- **Fernet encryption** for all stored OAuth tokens
- **JWT (HS256)** for authentication

### Frontend
- **React 18** · **TypeScript** · **Vite**
- **Tailwind CSS** · **Framer Motion**
- **Zustand** for auth state
- **Axios** for API communication
- **EventSource** (native SSE) for real-time streaming

### Integrations
- **Gmail + Google Sheets** — `google-api-python-client` with OAuth 2.0
- **Slack** — `slack-sdk` with bot token
- **Notion** — `notion-client` with internal integration token

---

## Project Structure

```
flowmind/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── executor.py          # Workflow execution engine (SSE + retry + chaining)
│   │   │   └── workflow_agent.py    # LLM call → structured workflow JSON
│   │   ├── integrations/
│   │   │   ├── gmail.py             # Gmail API client (real + simulated fallback)
│   │   │   ├── sheets.py            # Google Sheets API client
│   │   │   ├── slack.py             # Slack SDK client
│   │   │   └── notion.py            # Notion SDK client
│   │   ├── models/                  # SQLAlchemy models
│   │   ├── routers/                 # FastAPI route handlers
│   │   │   ├── auth.py              # Login, register, Google OAuth
│   │   │   ├── workflows.py         # CRUD, pause, delete, run-preview, history
│   │   │   ├── executions.py        # POST /test, GET /stream/{run_id} (SSE)
│   │   │   └── integrations.py      # Connect/disconnect integrations
│   │   ├── tasks/
│   │   │   └── email_poller.py      # Background email polling (asyncio)
│   │   └── main.py                  # App startup, lifespan, CORS
│   ├── .env.example                 # Template — copy to .env
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/                   # All page components
│   │   ├── hooks/useRunStream.ts    # SSE connection hook
│   │   ├── store/auth.ts            # Zustand auth store
│   │   └── lib/api.ts               # Axios instance + TypeScript types
│   └── vercel.json                  # API proxy for production (Vercel → Render)
├── DEPLOY_STEPS.md                  # Step-by-step Render + Vercel deployment
├── DEPLOYMENT_GUIDE.md              # Technical reference + SSL notes
├── LLM_SWITCHING.md                 # How to switch to OpenAI / Gemini / Anthropic
└── flowmind-interview-prep.html     # Interactive interview Q&A (open in browser)
```

---

## Local Development Setup

### Prerequisites
- Python 3.12+
- Node.js 18+
- A Google Cloud project with OAuth 2.0 credentials
- A Slack app with a bot token
- A Notion internal integration

### 1. Clone and set up the backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# Mac / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env` with your credentials. Minimum required to run locally:

```env
APP_ENV=local
DATABASE_URL=sqlite:///./flowmind_dev.db
JWT_SECRET_KEY=<run: python -c "import secrets; print(secrets.token_hex(32))">
ENCRYPTION_KEY=<run: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())">
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
TCS_API_KEY=<your LLM API key>
TCS_BASE_URL=<your LLM endpoint>
TCS_MODEL=<your model name>
```

### 3. Start the backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

The API is now at `http://localhost:8000`. Auto-docs at `http://localhost:8000/api/docs`.

### 4. Set up and start the frontend

```bash
cd frontend
npm install
npm run dev
```

The app is now at `http://localhost:5173`.

The Vite dev server proxies `/api/*` requests to the backend at port 8000 — no CORS configuration needed in development.

---

## How the Execution Engine Works

### SSE vs WebSocket

The workflow execution uses **Server-Sent Events (SSE)**, not WebSockets. During execution the browser only needs to *receive* events (step started, step completed, step failed) — it never sends anything back. SSE is one-directional, uses plain HTTP, works through every proxy automatically, and is the right tool for this use case. WebSocket would be over-engineering.

### Step chaining

Each step's output is accumulated in a `run_context` dictionary. Before every step runs, `_enrich_params()` merges the static AI-generated params with the accumulated context — so Gmail's email subject automatically becomes the Notion page title and the Slack message text, with no explicit wiring.

### Fail-fast strategy

If a step fails, the executor breaks immediately — subsequent steps never run. This is intentional: each step uses the previous step's output. If Notion fails to create a page, the Slack message would contain an empty page URL. Stopping early prevents wrong data reaching real services.

### Retry logic

Each step retries up to 3 times with exponential backoff (1s → 2s → 4s) on transient errors: network timeouts, connection resets, 429 rate limits, 503 service unavailable. Logical errors (401 Unauthorized, wrong params) are not retried — retrying won't fix them.

---

## Connecting Integrations

### Gmail + Google Sheets
Google OAuth 2.0 flow. Click Connect on the onboarding page — you'll be redirected to Google's consent screen. The app requests `gmail.modify` (read + label emails) and `spreadsheets` scopes. Access and refresh tokens are Fernet-encrypted before storage.

### Slack
Uses a bot token (`xoxb-...`). Slack's OAuth flow blocks bot-scoped redirects to localhost. Add `SLACK_BOT_TOKEN` to your `.env` — get it from api.slack.com → your app → OAuth & Permissions → Bot User OAuth Token. Invite the bot to your channel with `/invite @your-bot-name`.

### Notion
Create an internal integration at notion.so/my-integrations. Copy the token (`ntn_...` or `secret_...`) to `NOTION_API_KEY` in `.env`. Then share at least one Notion page with the integration via the page's Connections menu.

---

## LLM Configuration

The app uses the `openai` library with a configurable `base_url`, so any OpenAI-compatible API works. See `LLM_SWITCHING.md` for full details on switching providers.

| `APP_ENV` | Provider |
|---|---|
| `local` | TCS GenAI Lab (or any internal endpoint) — SSL verification disabled |
| anything else | OpenRouter (or OpenAI / Gemini) — standard SSL |

---

## Deployment

Deployed on **Render** (backend, free tier) + **Vercel** (frontend, free tier).

See `DEPLOY_STEPS.md` for the complete step-by-step guide with all values pre-filled.

**Quick summary:**
1. Deploy backend to Render — set all env vars, start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
2. Update `frontend/vercel.json` with your Render URL
3. Deploy frontend to Vercel — root dir: `frontend`, output: `dist`
4. Update Google OAuth redirect URIs to point to your Render backend
5. Run the smoke test checklist in `DEPLOY_STEPS.md`

---

## Security Notes

- All OAuth tokens (Gmail, Sheets, Slack, Notion) are **Fernet-encrypted** before being written to the database
- JWT tokens are signed with HS256 — generate a fresh `JWT_SECRET_KEY` for production
- Every database query filters by `user_id` from the JWT — users cannot access each other's workflows
- The `.env` file is in `.gitignore` and must never be committed
- The dev `ENCRYPTION_KEY` and `JWT_SECRET_KEY` must not be reused in production — generate new ones

---

## API Reference

Auto-generated docs available at `/api/docs` when `DEBUG=true`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register with email + password |
| `POST` | `/api/v1/auth/login` | Login, returns JWT |
| `GET` | `/api/v1/auth/google` | Start Google OAuth flow |
| `GET` | `/api/v1/auth/me` | Get current user |
| `GET` | `/api/v1/workflows` | List user's workflows |
| `POST` | `/api/v1/workflows` | Create workflow (triggers AI) |
| `GET` | `/api/v1/workflows/{id}` | Get workflow detail |
| `PATCH` | `/api/v1/workflows/{id}/activate` | Activate workflow |
| `PATCH` | `/api/v1/workflows/{id}/pause` | Toggle pause/resume |
| `DELETE` | `/api/v1/workflows/{id}` | Delete workflow |
| `GET` | `/api/v1/workflows/{id}/run-preview` | Preview what will execute |
| `POST` | `/api/v1/workflows/{id}/test` | Start a test run |
| `GET` | `/api/v1/stream/{run_id}` | SSE stream of execution events |
| `GET` | `/api/v1/workflows/{id}/runs` | Run history with step logs |
| `GET` | `/api/v1/integrations` | List connection status |
| `POST` | `/api/v1/integrations/{provider}/connect` | Connect an integration |
| `DELETE` | `/api/v1/integrations/{provider}` | Disconnect an integration |
| `GET` | `/api/v1/health` | Health check |

---

## License

MIT