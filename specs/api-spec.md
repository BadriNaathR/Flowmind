# Database & API Design — FlowMind

> **Version**: 1.1  
> **Status**: Active  
> **Last Updated**: 2026-11-13  
> **Author**: Badri + Claude (Solution Architect)
>
> **v1.1 change**: Users table updated for dual auth (Sprint 1b) — `google_id` now nullable, `password_hash` added. Two new auth endpoints: `POST /auth/register` and `POST /auth/login`. All other schema and endpoints unchanged.

---

## 1. Database Schema

### 1.1 Entity Relationship Overview

```
users
  │
  ├── integrations (one user → many integrations)
  │
  └── workflows (one user → many workflows)
        │
        └── workflow_runs (one workflow → many runs)
              │
              └── workflow_run_logs (one run → many step logs)
```

---

### 1.2 Table: `users`

Stores authenticated user accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email |
| name | VARCHAR(255) | NOT NULL | Display name |
| avatar_url | TEXT | NULLABLE | Google profile picture URL |
| google_id | VARCHAR(255) | UNIQUE, **NULLABLE** | Google OAuth subject ID — null for email/password users |
| password_hash | VARCHAR(255) | **NULLABLE** | bcrypt hash — null for Google-only users *(added Sprint 1b)* |
| created_at | TIMESTAMP | NOT NULL, default NOW() | Account creation time |
| updated_at | TIMESTAMP | NOT NULL, default NOW() | Last update time |

> **Sprint 1b change**: Dual authentication added. `google_id` made nullable to allow pure email/password accounts. `password_hash` added for email/password login. A user may have both (linked account) or one of the two.

```sql
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    name          VARCHAR(255) NOT NULL,
    avatar_url    TEXT,
    google_id     VARCHAR(255) UNIQUE,          -- nullable: null for email/password users
    password_hash VARCHAR(255),                  -- nullable: null for Google-only users
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

### 1.3 Table: `integrations`

Stores OAuth tokens for each connected service per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique integration record |
| user_id | UUID | FK → users.id, NOT NULL | Owner |
| provider | VARCHAR(50) | NOT NULL | 'gmail', 'slack', 'sheets', 'notion' |
| access_token | TEXT | NOT NULL | Encrypted OAuth access token |
| refresh_token | TEXT | NULLABLE | Encrypted OAuth refresh token |
| expires_at | TIMESTAMP | NULLABLE | Token expiry time |
| scopes | TEXT | NULLABLE | Granted OAuth scopes |
| metadata | JSONB | NULLABLE | Provider extras (slack workspace, notion workspace ID etc.) |
| created_at | TIMESTAMP | NOT NULL, default NOW() | |
| updated_at | TIMESTAMP | NOT NULL, default NOW() | |

**Unique constraint**: `(user_id, provider)` — one integration per provider per user.

```sql
CREATE TABLE integrations (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider      VARCHAR(50) NOT NULL,
    access_token  TEXT NOT NULL,
    refresh_token TEXT,
    expires_at    TIMESTAMP,
    scopes        TEXT,
    metadata      JSONB,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, provider)
);
```

---

### 1.4 Table: `workflows`

Stores workflow definitions created by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique workflow identifier |
| user_id | UUID | FK → users.id, NOT NULL | Owner |
| name | VARCHAR(255) | NOT NULL | Auto-generated or user-edited name |
| raw_input | TEXT | NOT NULL | Original plain English description from user |
| trigger | JSONB | NOT NULL | Trigger configuration (type, filters) |
| steps | JSONB | NOT NULL | Ordered array of step configurations |
| status | VARCHAR(20) | NOT NULL, default 'draft' | 'draft', 'active', 'paused', 'failed' |
| run_count | INTEGER | NOT NULL, default 0 | Total number of times this workflow has run |
| last_run_at | TIMESTAMP | NULLABLE | Timestamp of most recent run |
| created_at | TIMESTAMP | NOT NULL, default NOW() | |
| updated_at | TIMESTAMP | NOT NULL, default NOW() | |

**`trigger` JSONB structure:**
```json
{
  "type": "email_received",
  "integration": "gmail",
  "filters": {
    "subject_contains": "invoice",
    "from": null,
    "has_attachment": false
  }
}
```

**`steps` JSONB structure:**
```json
[
  {
    "step_id": "step_1",
    "name": "Extract email data",
    "integration": "gmail",
    "action": "extract_data",
    "params": { "fields": ["sender", "amount", "date"] },
    "depends_on": null
  },
  {
    "step_id": "step_2",
    "name": "Add to Google Sheet",
    "integration": "sheets",
    "action": "append_row",
    "params": { "sheet_name": "Expenses", "data": ["{{step_1.sender}}", "{{step_1.amount}}"] },
    "depends_on": "step_1"
  },
  {
    "step_id": "step_3",
    "name": "Notify on Slack",
    "integration": "slack",
    "action": "send_message",
    "params": { "channel": "#finance", "message": "New invoice: {{step_1.amount}} from {{step_1.sender}}" },
    "depends_on": "step_2"
  }
]
```

```sql
CREATE TABLE workflows (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    raw_input   TEXT NOT NULL,
    trigger     JSONB NOT NULL,
    steps       JSONB NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'draft',
    run_count   INTEGER NOT NULL DEFAULT 0,
    last_run_at TIMESTAMP,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_status ON workflows(status);
```

---

### 1.5 Table: `workflow_runs`

Stores each execution instance of a workflow.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique run identifier |
| workflow_id | UUID | FK → workflows.id, NOT NULL | Parent workflow |
| status | VARCHAR(20) | NOT NULL, default 'running' | 'running', 'success', 'failed', 'partial' |
| trigger_data | JSONB | NOT NULL | The data that triggered this run (email subject, sender etc.) |
| started_at | TIMESTAMP | NOT NULL, default NOW() | |
| completed_at | TIMESTAMP | NULLABLE | NULL while still running |
| error_message | TEXT | NULLABLE | Top-level error if entire run failed |
| created_at | TIMESTAMP | NOT NULL, default NOW() | |

```sql
CREATE TABLE workflow_runs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id   UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    status        VARCHAR(20) NOT NULL DEFAULT 'running',
    trigger_data  JSONB NOT NULL,
    started_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at  TIMESTAMP,
    error_message TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX idx_runs_status ON workflow_runs(status);
-- Auto-delete logs older than 30 days (handled by Celery scheduled task)
```

---

### 1.6 Table: `workflow_run_logs`

Stores step-level execution logs for each run.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique log entry |
| run_id | UUID | FK → workflow_runs.id, NOT NULL | Parent run |
| step_id | VARCHAR(50) | NOT NULL | Step identifier (e.g. 'step_1') |
| step_name | VARCHAR(255) | NOT NULL | Human-readable step name |
| status | VARCHAR(20) | NOT NULL | 'pending', 'running', 'success', 'failed', 'skipped' |
| input_data | JSONB | NULLABLE | Input params passed to this step |
| output_data | JSONB | NULLABLE | Output returned by this step |
| error_message | TEXT | NULLABLE | Error detail if step failed |
| retry_count | INTEGER | NOT NULL, default 0 | Number of retries attempted |
| duration_ms | INTEGER | NULLABLE | Step execution time in milliseconds |
| created_at | TIMESTAMP | NOT NULL, default NOW() | |

```sql
CREATE TABLE workflow_run_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id        UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    step_id       VARCHAR(50) NOT NULL,
    step_name     VARCHAR(255) NOT NULL,
    status        VARCHAR(20) NOT NULL,
    input_data    JSONB,
    output_data   JSONB,
    error_message TEXT,
    retry_count   INTEGER NOT NULL DEFAULT 0,
    duration_ms   INTEGER,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_logs_run_id ON workflow_run_logs(run_id);
```

---

## 2. API Endpoints

**Base URL**: `/api/v1`  
**Auth**: All endpoints (except `/auth/*`) require `Authorization: Bearer <jwt_token>` header.  
**Content-Type**: `application/json`

---

### 2.1 Auth Routes

#### `POST /api/v1/auth/register` *(added Sprint 1b)*
Create a new account with email and password.

**Request**:
```json
{ "name": "Badri", "email": "badri@example.com", "password": "MyPassword123" }
```

**Response** `201`:
```json
{ "access_token": "eyJ...", "token_type": "bearer", "user": { "id": "uuid", "email": "...", "name": "..." } }
```

---

#### `POST /api/v1/auth/login` *(added Sprint 1b)*
Login with email and password.

**Request**:
```json
{ "email": "badri@example.com", "password": "MyPassword123" }
```

**Response** `200`:
```json
{ "access_token": "eyJ...", "token_type": "bearer", "user": { ... } }
```

> If the email exists but was registered via Google OAuth, returns `400` with detail: *"This account uses Google Sign-In. Please use the Google login button."*

---

#### `GET /api/v1/auth/google`
Redirect user to Google OAuth consent screen.

**Response**: 302 redirect to Google OAuth URL

---

#### `GET /api/v1/auth/google/callback`
Handle Google OAuth callback. Issues JWT.

**Query Params**: `code`, `state`

**Response** `200`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Priya Kumar",
    "avatar_url": "https://..."
  }
}
```

---

#### `GET /api/v1/auth/me`
Get current authenticated user.

**Response** `200`:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Priya Kumar",
  "avatar_url": "https://...",
  "created_at": "2026-11-05T10:00:00Z"
}
```

---

#### `POST /api/v1/auth/logout`
Invalidate current session.

**Response** `200`: `{ "message": "Logged out successfully" }`

---

### 2.2 Integration Routes

#### `GET /api/v1/integrations`
List all integrations for current user.

**Response** `200`:
```json
[
  {
    "provider": "gmail",
    "connected": true,
    "connected_at": "2026-11-05T10:00:00Z",
    "metadata": { "email": "priya@gmail.com" }
  },
  {
    "provider": "slack",
    "connected": false
  },
  {
    "provider": "sheets",
    "connected": true,
    "connected_at": "2026-11-05T10:05:00Z",
    "metadata": { "email": "priya@gmail.com" }
  },
  {
    "provider": "notion",
    "connected": false
  }
]
```

---

#### `GET /api/v1/integrations/{provider}/connect`
Initiate OAuth for a provider. Provider: `gmail`, `slack`, `sheets`, `notion`.

**Response**: 302 redirect to provider OAuth URL

---

#### `GET /api/v1/integrations/{provider}/callback`
Handle OAuth callback for a provider.

**Response** `200`:
```json
{
  "provider": "gmail",
  "connected": true,
  "metadata": { "email": "priya@gmail.com" }
}
```

---

#### `DELETE /api/v1/integrations/{provider}`
Disconnect an integration. Removes stored tokens.

**Response** `200`: `{ "message": "gmail disconnected successfully" }`

---

### 2.3 Workflow Routes

#### `GET /api/v1/workflows`
List all workflows for current user.

**Query Params**: `status` (optional filter: active, paused, failed, draft)

**Response** `200`:
```json
[
  {
    "id": "uuid",
    "name": "Invoice Email to Sheet",
    "status": "active",
    "run_count": 42,
    "last_run_at": "2026-11-05T09:30:00Z",
    "created_at": "2026-11-01T10:00:00Z",
    "trigger": { "type": "email_received", "integration": "gmail" }
  }
]
```

---

#### `POST /api/v1/workflows/parse`
Parse natural language input into a structured workflow. **Streaming response.**

**Request**:
```json
{
  "input": "When I get an email with an invoice, extract the amount and sender, add to my Expenses sheet, and send a Slack message to #finance"
}
```

**Response**: `text/event-stream` (SSE)
```
data: {"type": "thinking", "text": "Understanding your request..."}
data: {"type": "thinking", "text": "Identified trigger: email received with 'invoice'..."}
data: {"type": "thinking", "text": "Identified 3 actions..."}
data: {"type": "result", "workflow": { "name": "Invoice Email Handler", "trigger": {...}, "steps": [...] }}
data: {"type": "done"}
```

---

#### `POST /api/v1/workflows`
Save a parsed workflow to the database (after user confirms).

**Request**:
```json
{
  "name": "Invoice Email Handler",
  "raw_input": "When I get an email with an invoice...",
  "trigger": { "type": "email_received", "integration": "gmail", "filters": { "subject_contains": "invoice" } },
  "steps": [ {...}, {...}, {...} ]
}
```

**Response** `201`:
```json
{
  "id": "uuid",
  "name": "Invoice Email Handler",
  "status": "draft",
  "created_at": "2026-11-05T10:00:00Z"
}
```

---

#### `GET /api/v1/workflows/{id}`
Get full workflow details including trigger and steps.

**Response** `200`:
```json
{
  "id": "uuid",
  "name": "Invoice Email Handler",
  "status": "active",
  "raw_input": "When I get an email with invoice...",
  "trigger": { ... },
  "steps": [ ... ],
  "run_count": 42,
  "last_run_at": "2026-11-05T09:30:00Z",
  "created_at": "2026-11-01T10:00:00Z"
}
```

---

#### `PATCH /api/v1/workflows/{id}`
Update workflow name or status.

**Request**:
```json
{
  "name": "My Invoice Workflow",
  "status": "paused"
}
```

**Response** `200`: Updated workflow object.

---

#### `DELETE /api/v1/workflows/{id}`
Delete a workflow and all its run history.

**Response** `200`: `{ "message": "Workflow deleted" }`

---

#### `POST /api/v1/workflows/{id}/activate`
Activate a workflow. Starts the trigger watcher.

**Response** `200`:
```json
{ "id": "uuid", "status": "active", "message": "Workflow is now active" }
```

---

#### `POST /api/v1/workflows/{id}/pause`
Pause a workflow. Stops the trigger watcher.

**Response** `200`:
```json
{ "id": "uuid", "status": "paused", "message": "Workflow paused" }
```

---

#### `POST /api/v1/workflows/{id}/test`
Run a test execution of the workflow. **Streaming response.**

**Request**: `{}` (empty — uses most recent matching data)

**Response**: `text/event-stream` (SSE)
```
data: {"type": "run_started", "run_id": "uuid"}
data: {"type": "step_start", "step_id": "step_1", "step_name": "Extract email data"}
data: {"type": "step_success", "step_id": "step_1", "output": {"sender": "acme@corp.com", "amount": "15000"}}
data: {"type": "step_start", "step_id": "step_2", "step_name": "Add to Google Sheet"}
data: {"type": "step_success", "step_id": "step_2", "output": {"row_added": 24}}
data: {"type": "step_start", "step_id": "step_3", "step_name": "Notify on Slack"}
data: {"type": "step_success", "step_id": "step_3", "output": {"message_sent": true}}
data: {"type": "run_complete", "status": "success"}
```

---

### 2.4 Execution & Log Routes

#### `GET /api/v1/workflows/{id}/runs`
Get run history for a workflow. Last 30 days only.

**Query Params**: `page` (default 1), `limit` (default 20)

**Response** `200`:
```json
{
  "runs": [
    {
      "id": "uuid",
      "status": "success",
      "started_at": "2026-11-05T09:30:00Z",
      "completed_at": "2026-11-05T09:30:03Z",
      "duration_ms": 3120
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 20
}
```

---

#### `GET /api/v1/runs/{run_id}`
Get details of a specific run including all step logs.

**Response** `200`:
```json
{
  "id": "uuid",
  "workflow_id": "uuid",
  "status": "success",
  "trigger_data": { "email_subject": "Invoice from Acme Corp", "sender": "billing@acme.com" },
  "started_at": "2026-11-05T09:30:00Z",
  "completed_at": "2026-11-05T09:30:03Z",
  "logs": [
    {
      "step_id": "step_1",
      "step_name": "Extract email data",
      "status": "success",
      "output_data": { "sender": "billing@acme.com", "amount": "15000", "date": "2026-11-05" },
      "duration_ms": 820,
      "retry_count": 0
    },
    {
      "step_id": "step_2",
      "step_name": "Add to Google Sheet",
      "status": "success",
      "output_data": { "row_added": 24 },
      "duration_ms": 1240,
      "retry_count": 0
    },
    {
      "step_id": "step_3",
      "step_name": "Notify on Slack",
      "status": "success",
      "output_data": { "message_ts": "1234567890.123" },
      "duration_ms": 1060,
      "retry_count": 0
    }
  ]
}
```

---

#### `GET /api/v1/stream/{run_id}`
SSE endpoint to stream live logs for an ongoing run.

**Response**: `text/event-stream`

Same event format as the test run stream. Client connects via `EventSource`. Connection closes when run completes.

---

#### `POST /api/v1/runs/{run_id}/retry`
Retry a failed run from the beginning.

**Response** `200`:
```json
{ "new_run_id": "uuid", "message": "Retry run started" }
```

---

## 3. Standard Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 403 | `FORBIDDEN` | Resource belongs to another user |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Integration already connected |
| 422 | `PARSE_ERROR` | AI could not parse workflow input |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

**Error response format:**
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Workflow not found",
    "detail": null
  }
}
```

---

## 4. Data Retention Policy

| Data | Retention |
|------|-----------|
| User accounts | Until deletion |
| Workflow definitions | Until deletion |
| Workflow run records | 30 days |
| Workflow run logs | 30 days |
| OAuth tokens | Until integration disconnected |

A Celery **scheduled task** runs daily at midnight to delete runs and logs older than 30 days.

---

*Next Phase: Implementation Planning*  
*Spec file: `specs/implementation-plan.md`*
