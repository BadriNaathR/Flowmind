# Test Plan — FlowMind

> **Version**: 1.0  
> **Status**: Complete  
> **Last Updated**: 2026-11-05  
> **Author**: Badri + Claude (QA)  
> **Linked Spec**: `product-spec.md` v1.1 (US-001 through US-015)

---

## 1. Test Strategy

### 1.1 Philosophy
Tests are derived **directly from the Given/When/Then acceptance criteria** in `product-spec.md`. Every user story has at least one test per acceptance criterion. If there is no acceptance criterion for a behavior, there is no test for it — and that behavior should not exist.

### 1.2 Test Pyramid

```
        ▲  E2E Tests (10%)
       ▲▲  Integration Tests (30%)
      ▲▲▲  Unit Tests (60%)
```

| Layer | Scope | Tool | Speed | Count Target |
|-------|-------|------|-------|--------------|
| Unit | Individual functions, agents, validators | pytest | Seconds | ~80 tests |
| Integration | API endpoints + DB, end-to-end agent runs | pytest + httpx | Minutes | ~40 tests |
| E2E | Full user flows in a real browser | Playwright | Minutes | ~15 tests |

### 1.3 Coverage Targets

| Layer | Target | Rationale |
|-------|--------|-----------|
| Unit (backend logic) | 90%+ line coverage | Business logic must be fully tested |
| Integration (API) | 100% of endpoints | Every endpoint exercised at least once |
| E2E (critical paths) | All 7 user journeys | Demo flows must never break |

### 1.4 Test Environment

| Environment | Purpose | DB | LLM |
|-------------|---------|-----|-----|
| Local (dev) | Development testing | SQLite in-memory | TCS GenAI Lab (local) |
| CI (GitHub Actions) | Automated on every PR | PostgreSQL (testcontainers) | Mocked responses |
| Staging | Pre-deploy smoke tests | Neon PostgreSQL (staging DB) | OpenRouter |

---

## 2. Unit Tests

### 2.1 Workflow Parser Agent (`agents/parser_agent.py`)

| Test ID | Test Name | Input | Expected Output | US |
|---------|-----------|-------|-----------------|-----|
| UT-001 | Parse simple email trigger | "When I get an invoice email, log it to my sheet" | trigger: email_received, actions: [sheets_append_row] | US-004 |
| UT-002 | Parse multi-step workflow | "When I get an invoice email, extract amount, add to sheet, ping Slack" | trigger: email_received, actions: [extract_data, sheets_append_row, slack_message] | US-004 |
| UT-003 | Parse with named channel | "Send a message to #invoices channel" | slack action with channel: "#invoices" | US-005 |
| UT-004 | Parse with named sheet | "Add to my Expenses sheet" | sheets action with sheet: "Expenses" | US-005 |
| UT-005 | Detect ambiguous sheet reference | "Add to my sheet" (no sheet name) | ambiguity flag: "which_sheet", question generated | US-005 |
| UT-006 | Detect ambiguous Slack target | "Send me a Slack message" | ambiguity flag: "which_slack_channel" | US-005 |
| UT-007 | Reject unknown integration | "Post to my TikTok" | error: unsupported_integration | US-004 |
| UT-008 | Parse correction delta | Original: Slack to #general. Correction: "No, send to #invoices" | Updated action: channel "#invoices" | US-014 |
| UT-009 | Completely rephrase after 3 failed corrections | 3+ corrections with still-wrong output | Returns needs_restart: true | US-014 |
| UT-010 | Extract email subject filter | "emails with the word invoice in the subject" | trigger filter: subject_contains="invoice" | US-004 |
| UT-011 | Extract email sender filter | "emails from procurement@acme.com" | trigger filter: sender="procurement@acme.com" | US-004 |
| UT-012 | Parse multi-field extraction | "extract the amount, date, and sender" | extract_data fields: [amount, date, sender] | US-004 |
| UT-013 | WorkflowSchema Pydantic validation — valid | Well-formed workflow dict | Passes validation, returns WorkflowSchema | US-005 |
| UT-014 | WorkflowSchema Pydantic validation — missing trigger | Workflow dict with no trigger | Raises ValidationError | US-005 |
| UT-015 | WorkflowSchema Pydantic validation — empty actions | Workflow dict with actions: [] | Raises ValidationError | US-005 |

---

### 2.2 Execution Engine (`agents/executor.py`)

| Test ID | Test Name | Scenario | Expected | US |
|---------|-----------|----------|----------|-----|
| UT-016 | Successful 3-step execution | All steps return success | run status: success, all 3 steps logged | US-010 |
| UT-017 | Step failure stops subsequent steps | Step 2 fails | Step 1: success, Step 2: failed, Step 3: not_executed | US-015 |
| UT-018 | Transient error triggers retry | Step raises network timeout | Retried after 10s, 30s, 60s | US-015 |
| UT-019 | Retry succeeds on 2nd attempt | Step fails once, succeeds on retry | Step logged as "success (retried 1 time)" | US-015 |
| UT-020 | All 3 retries exhausted | Step fails 3 times | Step marked failed, run marked failed, failure_notification triggered | US-015 |
| UT-021 | Permanent error — no retry | Step raises ValueError (bad config) | No retry, immediately marked failed with error_reason | US-015 |
| UT-022 | Template variable resolution | Step uses `{{step_1.amount}}` | Variable resolved from prior step output | US-010 |
| UT-023 | Missing template variable | Step uses `{{step_2.amount}}` but step 2 doesn't have "amount" | Raises ConfigError, step fails with clear message | US-010 |
| UT-024 | Execution is isolated per run | Two runs for same workflow | Each run has its own log entries, no cross-contamination | US-010 |
| UT-025 | Each step logged with timestamp | Any step execution | Log entry has: step_index, status, started_at, completed_at, input_data, output_data | US-010 |

---

### 2.3 Integration Clients

**Gmail (`integrations/gmail.py`)**

| Test ID | Test Name | Scenario | Expected | US |
|---------|-----------|----------|----------|-----|
| UT-026 | Extract email fields | Mock email with subject/body/sender | Returns dict with subject, body, sender, date | US-004 |
| UT-027 | Filter by subject contains | Email matches filter | Returns the email | US-004 |
| UT-028 | Filter by subject contains — no match | Email doesn't match filter | Returns None (no trigger) | US-004 |
| UT-029 | Send email success | Valid recipient + content | Returns message_id from Gmail API | US-004 |
| UT-030 | Apply label | Valid label name | Label applied, returns success | US-004 |

**Slack (`integrations/slack.py`)**

| Test ID | Test Name | Scenario | Expected | US |
|---------|-----------|----------|----------|-----|
| UT-031 | Send channel message | Valid channel + message | Returns ts (message timestamp) | US-004 |
| UT-032 | Send DM | Valid user ID + message | Returns ts | US-004 |
| UT-033 | Channel not found | Channel "#nonexistent" | Raises SlackError with channel_not_found | US-015 |

**Google Sheets (`integrations/sheets.py`)**

| Test ID | Test Name | Scenario | Expected | US |
|---------|-----------|----------|----------|-----|
| UT-034 | Append row | Valid sheet ID + row data | Row appended, returns updated range | US-004 |
| UT-035 | Sheet not found | Sheet name doesn't exist | Raises SheetsError with not_found | US-015 |
| UT-036 | Update specific cell | Row index + column + value | Cell updated | US-004 |

**Notion (`integrations/notion.py`)**

| Test ID | Test Name | Scenario | Expected | US |
|---------|-----------|----------|----------|-----|
| UT-037 | Create page in database | Valid database ID + properties | Returns new page ID | US-004 |
| UT-038 | Database not found | Invalid database ID | Raises NotionError with not_found | US-015 |

---

### 2.4 Auth & Security (`core/security.py`)

| Test ID | Test Name | Scenario | Expected | US |
|---------|-----------|----------|----------|-----|
| UT-039 | JWT creation | Valid user_id | Returns signed JWT with correct payload and expiry | US-001 |
| UT-040 | JWT verification — valid | Valid unexpired token | Returns decoded payload with user_id | US-001 |
| UT-041 | JWT verification — expired | Token past expiry | Raises TokenExpiredError | US-001 |
| UT-042 | JWT verification — tampered | Token with modified payload | Raises InvalidTokenError | US-001 |
| UT-043 | OAuth token encryption | Raw OAuth token string | Returns encrypted ciphertext (not plaintext) | US-002 |
| UT-044 | OAuth token decryption | Encrypted ciphertext | Returns original plaintext token | US-002 |
| UT-045 | Different tokens produce different ciphertext | Two different tokens | Outputs are different (no deterministic encryption) | US-002 |

---

## 3. Integration Tests

All integration tests use `httpx.AsyncClient` with the FastAPI app. The database is a real PostgreSQL instance (testcontainer) seeded per test with `pytest` fixtures.

### 3.1 Auth Endpoints

| Test ID | Endpoint | Scenario | Expected Status | Expected Body | US |
|---------|----------|----------|-----------------|---------------|----|
| IT-001 | GET /api/v1/auth/google | Called directly | 302 Redirect | Location: Google OAuth URL | US-001 |
| IT-002 | GET /api/v1/auth/google/callback (valid code) | Valid OAuth code (mocked Google) | 200 | { access_token, token_type } | US-001 |
| IT-003 | GET /api/v1/auth/google/callback (invalid code) | Invalid / expired code | 400 | { error: "invalid_grant" } | US-001 |
| IT-004 | GET /api/v1/auth/me (authenticated) | Valid JWT in header | 200 | { id, email, name, avatar_url } | US-001 |
| IT-005 | GET /api/v1/auth/me (unauthenticated) | No JWT | 401 | { error: "unauthorized" } | US-001 |
| IT-006 | POST /api/v1/auth/logout | Valid JWT | 200 | { message: "logged out" } | US-001 |

---

### 3.2 Integration Endpoints

| Test ID | Endpoint | Scenario | Expected Status | Expected Body | US |
|---------|----------|----------|-----------------|---------------|----|
| IT-007 | GET /api/v1/integrations | Authenticated user, 2 integrations connected | 200 | Array of 4 providers with connected: true/false | US-003 |
| IT-008 | GET /api/v1/integrations/gmail/connect | Valid OAuth callback (mocked) | 302 | Redirect to onboarding with connected=true | US-002 |
| IT-009 | DELETE /api/v1/integrations/gmail | Gmail connected | 200 | { message: "disconnected" } | US-003 |
| IT-010 | DELETE /api/v1/integrations/gmail (not connected) | Gmail not connected | 404 | { error: "not_connected" } | US-003 |
| IT-011 | Active workflow paused on disconnect | Disconnect Gmail, active Gmail workflow exists | 200 + side effect | Integration deleted, workflow paused | US-003 |

---

### 3.3 Workflow Endpoints

| Test ID | Endpoint | Scenario | Expected Status | Expected Body | US |
|---------|----------|----------|-----------------|---------------|----|
| IT-012 | POST /api/v1/workflows/parse (valid input) | Real text input, mocked LLM response | 200 (SSE stream) | Streamed JSON ending with parsed workflow | US-004, US-005 |
| IT-013 | POST /api/v1/workflows/parse (empty input) | body: { text: "" } | 422 | Validation error | US-004 |
| IT-014 | POST /api/v1/workflows (valid body) | Confirmed workflow object | 201 | { id, name, trigger, actions, status: "draft" } | US-005 |
| IT-015 | POST /api/v1/workflows (missing trigger) | No trigger in body | 422 | Validation error | US-005 |
| IT-016 | GET /api/v1/workflows | 3 workflows for user | 200 | Array of 3 workflow summaries | US-009 |
| IT-017 | GET /api/v1/workflows/{id} | Valid workflow ID | 200 | Full workflow object with trigger + actions | US-006 |
| IT-018 | GET /api/v1/workflows/{id} (other user's) | Workflow belongs to different user | 404 | Not found (no ownership leak) | US-009 |
| IT-019 | PATCH /api/v1/workflows/{id} | Update workflow name | 200 | Updated workflow | US-011 |
| IT-020 | DELETE /api/v1/workflows/{id} | Valid workflow ID | 200 | { message: "deleted" } | US-011 |
| IT-021 | POST /api/v1/workflows/{id}/pause (active) | Active workflow | 200 | { status: "paused" } | US-011 |
| IT-022 | POST /api/v1/workflows/{id}/pause (already paused) | Paused workflow | 200 | { status: "paused" } (idempotent) | US-011 |
| IT-023 | POST /api/v1/workflows/{id}/activate | Draft or paused workflow | 200 | { status: "active" } | US-008 |
| IT-024 | POST /api/v1/workflows/{id}/activate (missing integration) | Required integration not connected | 400 | { error: "integration_not_connected", integration: "gmail" } | US-008 |

---

### 3.4 Execution Endpoints

| Test ID | Endpoint | Scenario | Expected Status | Expected Body | US |
|---------|----------|----------|-----------------|---------------|----|
| IT-025 | POST /api/v1/workflows/{id}/test | Valid workflow, mocked integrations | 200 (SSE stream) | Streamed step logs, final status: success | US-007 |
| IT-026 | GET /api/v1/stream/{run_id} | Active run in progress | 200 (SSE stream) | Live step events as they complete | US-010 |
| IT-027 | GET /api/v1/workflows/{id}/runs | 5 past runs | 200 | Paginated array of run summaries | US-013 |
| IT-028 | GET /api/v1/runs/{run_id} | Valid run ID | 200 | Run detail with all step logs | US-010 |
| IT-029 | POST /api/v1/runs/{run_id}/retry | Failed run | 202 | { message: "retry queued", new_run_id } | US-013 |
| IT-030 | GET /api/v1/runs/{run_id} (other user's) | Run belongs to different user | 404 | Not found | US-010 |

---

### 3.5 AI Parser — End-to-End (Mocked LLM)

| Test ID | Scenario | Input | Expected Workflow Structure | US |
|---------|----------|-------|-----------------------------|----|
| IT-031 | Invoice email → sheet → Slack | "When I get an invoice email, extract amount and add to Expenses sheet and notify #finance" | trigger: email, actions: [extract, sheets, slack] | US-004 |
| IT-032 | Correction flow | Parse then correct "No, send to #invoices not #finance" | actions[2].channel = "#invoices" | US-014 |
| IT-033 | Ambiguity detected and resolved | "Add to my sheet" → user picks "Expenses" | sheets action with sheet="Expenses" | US-005 |
| IT-034 | Retry on LLM timeout | LLM API returns 429 on first call | Retried, second call succeeds | US-015 |

---

## 4. End-to-End Tests (Playwright)

All E2E tests run against a local stack with the full app running (`docker-compose up`). The LLM is mocked to return deterministic responses to keep tests fast and reliable.

### 4.1 Critical User Journeys

**E2E-001: First-Time User Onboarding**  
_Covers: US-001, US-002_

```
1. Navigate to / (landing page)
2. Click "Start Automating Free"
3. Click "Continue with Google" → mock Google OAuth → land on Onboarding
4. Assert: Onboarding screen shows 4 integration cards (all "Not Connected")
5. Click "Connect" on Gmail card → mock OAuth popup → assert card shows "Connected ✓"
6. Click "Connect" on Slack card → mock OAuth popup → assert card shows "Connected ✓"
7. Click "Continue"
8. Assert: Redirected to Create Workflow screen
```

---

**E2E-002: Create and Activate a Workflow (Happy Path)**  
_Covers: US-004, US-005, US-006, US-007, US-008_

```
1. Log in as an existing user (fixture)
2. Click "New Workflow"
3. Type: "When I get an invoice email, extract amount and log to Expenses sheet"
4. Click "Build My Workflow"
5. Assert: AI Processing screen shows (typewriter animation visible)
6. Wait for Confirmation screen
7. Assert: Shows trigger (email) and 2 action steps in plain English
8. Click "Looks good!"
9. Assert: Visual Preview shows 3 nodes connected by arrows
10. Click "Test Run"
11. Assert: Real-time logs appear with each step completing
12. Assert: "Test completed successfully" banner visible
13. Click "Activate Workflow"
14. Assert: Redirected to Dashboard
15. Assert: New workflow card shows status "Active"
```

---

**E2E-003: Correct AI Misunderstanding**  
_Covers: US-005, US-014_

```
1. Create workflow: "When I get an invoice email, notify #general on Slack"
2. Land on Confirmation screen
3. Assert: Shows Slack action with channel "#general"
4. Type in correction box: "Actually send to #invoices channel"
5. Click "Re-process"
6. Assert: Confirmation updates — Slack action now shows "#invoices"
7. Click "Looks good!"
8. Assert: Visual Preview shows updated channel
```

---

**E2E-004: Pause and Resume Workflow**  
_Covers: US-011_

```
1. Have an Active workflow on Dashboard
2. Click "Pause" on workflow card
3. Assert: Status badge changes to "Paused" (yellow)
4. Assert: Toast notification: "Workflow paused"
5. Click on workflow card → open detail screen
6. Click "Resume"
7. Assert: Status badge changes to "Active" (green)
```

---

**E2E-005: Delete Workflow with Confirmation**  
_Covers: US-011_

```
1. Have at least one workflow on Dashboard
2. Click "Delete" on workflow card
3. Assert: Confirmation dialog appears with workflow name in the message
4. Click outside dialog → assert dialog closes, workflow still present
5. Click "Delete" again → Click "Delete permanently"
6. Assert: Workflow card removed from Dashboard
7. Assert: Toast notification: "Workflow deleted"
```

---

**E2E-006: View Real-Time Execution Logs**  
_Covers: US-010_

```
1. Have an Active workflow
2. Trigger a test run (or wait for automatic execution)
3. Navigate to Workflow Detail screen during execution
4. Assert: Log panel visible and updating in real-time (at least 2 steps visible as they complete)
5. Assert: Each log entry shows integration icon, step name, status, and output
6. Wait for completion
7. Assert: Final entry shows "Workflow completed successfully"
```

---

**E2E-007: View Run History**  
_Covers: US-013_

```
1. Have a workflow with 5+ past runs (mix of success and failed)
2. Navigate to Workflow Detail screen
3. Assert: Run History table shows runs sorted by most recent first
4. Assert: Each row shows date, status badge, and duration
5. Click a failed run row
6. Assert: Step-by-step log expands inline
7. Assert: Failed step shows in red with error message
8. Assert: Steps after the failure show "Not executed"
```

---

**E2E-008: Integration Disconnect Pauses Active Workflows**  
_Covers: US-003_

```
1. Have an active Gmail workflow
2. Navigate to Settings → Integrations
3. Click "Disconnect" on Gmail
4. Assert: Gmail card shows "Not Connected"
5. Navigate to Dashboard
6. Assert: Workflow that used Gmail now shows "Paused" status badge
```

---

**E2E-009: Failure Notification Sent on Workflow Failure**  
_Covers: US-012_

```
1. Create a workflow with a deliberately broken step (invalid sheet name)
2. Activate workflow and trigger execution
3. Assert: All 3 retries are attempted (visible in logs with timestamps)
4. Assert: Run marked "Failed" after final retry
5. Assert: Failure email sent to user's registered email (check with MailHog in test env)
6. Assert: Email contains workflow name, failed step, error message, and log link
```

---

**E2E-010: Empty Dashboard State**  
_Covers: US-009_

```
1. Log in as a brand-new user (no workflows)
2. Navigate to Dashboard
3. Assert: Empty state illustration is visible
4. Assert: "Create Your First Workflow" button is visible
5. Click "Create Your First Workflow"
6. Assert: Redirected to Create Workflow screen
```

---

## 5. Edge Case & Security Tests

### 5.1 Security Tests

| Test ID | Category | Scenario | Expected | US |
|---------|----------|----------|----------|----|
| SEC-001 | Authorization | Access another user's workflow by ID | 404 (not 403 — no ownership leak) | US-009 |
| SEC-002 | Authorization | Access another user's run by ID | 404 | US-013 |
| SEC-003 | JWT tampering | Modify payload of valid JWT | 401 Unauthorized | US-001 |
| SEC-004 | Token storage | Inspect DB — OAuth tokens stored encrypted | Ciphertext in DB, not plaintext | US-002 |
| SEC-005 | Input injection | Workflow description with SQL injection attempt | Treated as literal text, no DB error | US-004 |
| SEC-006 | Input injection | Workflow description with XSS payload | Rendered as escaped text, no script execution | US-004 |
| SEC-007 | Rate limiting | 20+ rapid calls to /workflows/parse | 429 Too Many Requests after threshold | US-004 |
| SEC-008 | Email content storage | Check DB after workflow run on real email | Email body NOT stored in DB | Non-functional |

### 5.2 Performance Tests

| Test ID | Scenario | Target | Measurement |
|---------|----------|--------|-------------|
| PERF-001 | Workflow parse response time | ≤ 5 seconds P95 | Time from request to first SSE token |
| PERF-002 | Trigger to execution start | ≤ 60 seconds | Time from Gmail email arrival to Celery task picked up |
| PERF-003 | UI interaction response | ≤ 200ms | Lighthouse interaction timing |
| PERF-004 | Dashboard load with 20 workflows | ≤ 1 second | Time to first meaningful paint |
| PERF-005 | Log stream latency | ≤ 2 seconds | Time from step completion to SSE event received by browser |

---

## 6. Test Data & Fixtures

### 6.1 Standard Fixtures (`tests/conftest.py`)

```python
# User fixtures
@pytest.fixture
def user_no_integrations()     # Fresh user, no integrations connected
def user_gmail_only()           # Gmail connected only  
def user_all_integrations()     # All 4 integrations connected

# Workflow fixtures  
@pytest.fixture
def draft_workflow()            # Parsed but not activated
def active_workflow()           # Activated, Gmail trigger
def paused_workflow()           # Paused by user
def failed_workflow()           # Failed after 3 retries

# Run fixtures
@pytest.fixture
def successful_run()            # All 3 steps green
def failed_run_step_2()         # Step 2 failed, step 3 not_executed
def partial_run()               # Step 1 and 2 success, step 3 failed
```

### 6.2 Mock Email Payload (Used for Gmail Trigger Tests)

```json
{
  "id": "mock-email-001",
  "threadId": "mock-thread-001",
  "from": "procurement@acme.com",
  "subject": "Invoice #1042 from Acme Corp",
  "body": "Please find attached invoice #1042 for ₹15,000 for services rendered in October 2026.",
  "date": "2026-11-05T09:00:00Z",
  "labels": ["INBOX", "UNREAD"]
}
```

### 6.3 Mock LLM Response (Used in CI Tests)

```json
{
  "trigger": {
    "type": "email_received",
    "filter": { "subject_contains": "invoice" }
  },
  "actions": [
    { "type": "extract_data", "fields": ["amount", "sender", "date"] },
    { "type": "sheets_append_row", "sheet": "Expenses", "data": ["amount", "sender", "date"] },
    { "type": "slack_message", "channel": "#finance", "message": "New invoice: {amount} from {sender}" }
  ]
}
```

---

## 7. CI/CD Test Pipeline

```yaml
# .github/workflows/test.yml (reference)
on: [push, pull_request]

jobs:
  unit-tests:
    - pytest tests/unit/ --cov=app --cov-report=xml
    - Assert coverage ≥ 90%

  integration-tests:
    - Start PostgreSQL (testcontainer)
    - Start Redis (testcontainer)
    - pytest tests/integration/ -v

  e2e-tests:
    - Build Docker image
    - docker-compose up -d
    - Wait for health check
    - playwright test tests/e2e/
    - Upload screenshots/videos on failure

  security-scan:
    - bandit -r app/ (Python security lint)
    - safety check (dependency vulnerabilities)
```

**Gate**: PRs cannot merge if any test fails or unit coverage drops below 90%.

---

## 8. Definition of Done (Test-Driven)

A user story is **Done** when:
1. All unit tests for its acceptance criteria pass ✅
2. All integration tests for its endpoints pass ✅
3. Its E2E test passes on the full stack ✅
4. Security test (if applicable) passes ✅
5. No new test failures introduced in the full test suite ✅

---

*Test plan linked to `product-spec.md` v1.1 (US-001 through US-015)*  
*Next: Sprint 0 Development — `implementation-plan.md`*
