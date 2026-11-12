# Product Specification — AI Workflow Automation Platform

> **Version**: 1.1  
> **Status**: Complete  
> **Last Updated**: 2026-11-05  
> **Author**: Badri + Claude (PM/BA/SA)

---

## 1. Product Overview

### 1.1 Product Name
**FlowMind**

### 1.2 Tagline
> *"Describe it. We automate it."*

### 1.3 What Is It?
FlowMind is an AI-powered workflow automation platform for non-technical startup founders. Users describe any automation they want in plain English and AI agents build, run, and manage the workflow automatically — no code, no complex configuration.

### 1.4 The Core Problem
Non-technical startup founders waste hours every day on repetitive tasks:
- Manually sorting and replying to emails
- Copy-pasting data between tools
- Chasing team updates and creating reports
- Logging invoices into spreadsheets

Existing tools (Zapier, Make) require technical knowledge to configure. FlowMind removes that barrier entirely with AI.

### 1.5 The Solution
A conversational interface where the user says what they want, and FlowMind's AI agents figure out the how — breaking it into steps, selecting the right integrations, and executing it automatically.

---

## 2. Goals & Success Metrics

### 2.1 Product Goals
1. A non-technical user can create their first workflow in under 3 minutes
2. AI correctly understands user intent with no correction needed in 80%+ of cases
3. Workflows execute reliably with real-time visibility into every step

### 2.2 Portfolio Goals
1. Demonstrate multi-agent AI system design (not just RAG)
2. Showcase full-stack engineering with production-quality UI/UX
3. Create a live, demoable product that impresses in a 5-minute interview window

---

## 3. User Persona

### Primary Persona: "The Startup Founder"
| Attribute | Detail |
|-----------|--------|
| Name | Priya / Arjun |
| Role | Founder / Co-founder of an early-stage startup (5–20 people) |
| Technical level | Non-technical — can use tools but cannot write code |
| Tools they use | Gmail, Slack, Google Sheets, Notion |
| Pain | Spends 2–3 hours/day on repetitive admin tasks |
| Goal | Focus on building the business, not managing tools |
| Frustration | Zapier is too complex, hiring someone for this feels wasteful |

---

## 4. Feature Specifications

### 4.1 Feature Priority Matrix

| Feature | Priority | Phase |
|---------|----------|-------|
| Google OAuth Login | Must Have | MVP |
| Integration Connections (Gmail, Slack, Sheets, Notion) | Must Have | MVP |
| Natural Language Workflow Input | Must Have | MVP |
| AI Workflow Parser & Confirmation | Must Have | MVP |
| Visual Workflow Preview | Must Have | MVP |
| Workflow Execution Engine | Must Have | MVP |
| Real-time Execution Logs | Must Have | MVP |
| Workflow Dashboard | Must Have | MVP |
| Test Run Before Activate | Must Have | MVP |
| Workflow History | Should Have | MVP |
| Failure Notifications (Email/Slack) | Should Have | MVP |
| Edit Existing Workflow | Should Have | MVP |
| Multi-step Conditional Logic | Nice to Have | Phase 2 |
| WhatsApp Integration | Nice to Have | Phase 2 |
| Team/Multi-user Support | Nice to Have | Phase 2 |
| Workflow Templates Library | Nice to Have | Phase 2 |

---

## 5. User Stories

### Authentication

**US-001**: As a user, I want to sign up and log in with my Google account so I don't need to remember a new password.

**Acceptance Criteria**:
- **Given** I am on the login page  
  **When** I click "Continue with Google" and authorize FlowMind in the Google consent screen  
  **Then** I am authenticated and redirected to the Onboarding screen (first time) or Dashboard (returning user)

- **Given** I am a returning user with an active session  
  **When** I open the FlowMind app  
  **Then** I am taken directly to the Dashboard without needing to log in again

- **Given** I am logged in  
  **When** I click "Sign Out"  
  **Then** my session is invalidated, all local tokens are cleared, and I am returned to the login page

---

### Onboarding

**US-002**: As a new user, I want to connect my tools (Gmail, Slack, Google Sheets, Notion) in one place so FlowMind can access them on my behalf.

**Acceptance Criteria**:
- **Given** I am on the Onboarding screen  
  **When** I click "Connect" on the Gmail card  
  **Then** a Google OAuth popup opens requesting Gmail permissions, and on approval, the Gmail card shows a green "Connected" checkmark

- **Given** I have connected at least one integration  
  **When** I click "Continue"  
  **Then** I am taken to the Create Workflow screen

- **Given** I have not connected any integrations  
  **When** I click "Skip for now"  
  **Then** I am taken to the Dashboard, and I can connect integrations later from Settings

- **Given** I try to connect an integration that fails (e.g., I deny the OAuth permission)  
  **When** I return from the OAuth screen  
  **Then** the card shows an error state ("Connection failed — try again") and no token is stored

---

**US-003**: As a user, I want to see which tools I've connected and disconnect them any time.

**Acceptance Criteria**:
- **Given** I am on the Settings screen  
  **When** I view the Integrations section  
  **Then** I see a list of all 4 integrations with their connection status (Connected / Not Connected)

- **Given** I have a connected integration  
  **When** I click "Disconnect"  
  **Then** the OAuth token is deleted from the database, the card reverts to "Not Connected", and any active workflows using this integration are paused automatically

- **Given** I have a disconnected integration  
  **When** I click "Connect"  
  **Then** the OAuth flow starts and, on success, the integration is reconnected

---

### Workflow Creation

**US-004**: As a user, I want to describe my workflow in plain English so I don't need to understand technical configurations.

**Acceptance Criteria**:
- **Given** I am on the Create Workflow screen  
  **When** I type a description in the text area and click "Build My Workflow"  
  **Then** the AI processing screen appears and begins streaming its analysis

- **Given** I am on the Create Workflow screen  
  **When** I click one of the suggested prompt examples  
  **Then** that prompt text populates the input area and I can edit it before submitting

- **Given** I submit a blank or single-word input  
  **When** I click "Build My Workflow"  
  **Then** I see an inline validation message: "Please describe what you want to automate" and the form does not submit

---

**US-005**: As a user, I want the AI to show me what it understood before it builds anything, so I can correct it if needed.

**Acceptance Criteria**:
- **Given** the AI has finished parsing my input  
  **When** I am shown the Confirmation screen  
  **Then** I see: the trigger, every action step in order, and the integrations required — all in plain English (no technical jargon)

- **Given** I am on the Confirmation screen  
  **When** I click "Looks good!"  
  **Then** the workflow is saved to the database and I am taken to the Visual Preview screen

- **Given** the AI understood me incorrectly  
  **When** I type a correction in plain English and submit it  
  **Then** the AI reprocesses my correction and shows an updated Confirmation screen (without navigating away)

- **Given** the AI cannot parse the input at all  
  **When** parsing fails  
  **Then** I see: "I couldn't understand that — could you rephrase? For example: 'When I receive an invoice email, log it to my Google Sheet.'"

---

**US-006**: As a user, I want to see a visual preview of my workflow steps so I know exactly what will run.

**Acceptance Criteria**:
- **Given** I have confirmed the AI's understanding  
  **When** I am on the Visual Preview screen  
  **Then** I see a node-graph with one Trigger node and one node per action step, connected by arrows, each showing the integration logo and action description

- **Given** I am viewing the Visual Preview  
  **When** I click any node  
  **Then** a tooltip shows the full details of that step (e.g., "Filter: email subject contains 'invoice'")

- **Given** I am viewing the Visual Preview  
  **When** I click "Edit"  
  **Then** I return to the Confirmation screen to revise the workflow

---

**US-007**: As a user, I want to test my workflow on real data before activating it so I can confirm it works correctly.

**Acceptance Criteria**:
- **Given** I am on the Visual Preview screen  
  **When** I click "Test Run"  
  **Then** the execution engine runs the workflow using my real connected accounts and I see real-time step-by-step logs as each step executes

- **Given** the test run completes successfully (all steps green)  
  **When** viewing the Test Run screen  
  **Then** I see "Test completed successfully" and the "Activate Workflow" button becomes enabled

- **Given** a test run step fails  
  **When** viewing the Test Run screen  
  **Then** I see the failed step in red with the error reason (e.g., "Could not find sheet named 'Expenses'"), subsequent steps are marked as skipped, and I see "Something's wrong? Describe the issue" to retry

---

**US-008**: As a user, I want to activate my workflow with one click so it starts running automatically.

**Acceptance Criteria**:
- **Given** the test run passed (or I chose to skip the test)  
  **When** I click "Activate Workflow"  
  **Then** the workflow status is set to "Active" in the database, the trigger listener starts, and I am redirected to the Dashboard where the new workflow appears with an "Active" badge

- **Given** a workflow is Active  
  **When** the trigger condition is met (e.g., a new email arrives)  
  **Then** the workflow executes automatically within 60 seconds of the trigger event

- **Given** I activate a workflow but one of its required integrations has since been disconnected  
  **When** attempting to activate  
  **Then** I see an error: "Gmail is not connected — reconnect it in Settings to activate this workflow"

---

### Workflow Management

**US-009**: As a user, I want a dashboard showing all my workflows with their status (active/paused/failed).

**Acceptance Criteria**:
- **Given** I have created workflows  
  **When** I visit the Dashboard  
  **Then** I see a card for each workflow showing: name, status badge (Active/Paused/Failed), last run time, and total run count

- **Given** I have no workflows yet  
  **When** I visit the Dashboard  
  **Then** I see an illustrated empty state with a "Create Your First Workflow" button

- **Given** a workflow status changes (e.g., fails during execution)  
  **When** I am on the Dashboard  
  **Then** the status badge updates within 30 seconds without requiring a page refresh

---

**US-010**: As a user, I want to see real-time logs when a workflow runs so I know exactly what happened.

**Acceptance Criteria**:
- **Given** a workflow is running  
  **When** I open the Workflow Detail screen  
  **Then** I see the execution log updating in real-time, showing each step with its status icon (spinner → green check or red X), timestamp, and output summary

- **Given** a workflow run has completed  
  **When** I click "View Logs" for that run  
  **Then** I see the full step-by-step log for that run, including input data, output data, and duration for each step

- **Given** a step produced an output (e.g., extracted invoice data)  
  **When** viewing the log for that step  
  **Then** I can see the actual extracted values (e.g., "Amount: ₹15,000 | Sender: Acme Corp")

---

**US-011**: As a user, I want to pause or delete a workflow any time.

**Acceptance Criteria**:
- **Given** I have an Active workflow  
  **When** I click "Pause" on the workflow card or detail screen  
  **Then** the trigger listener stops, the status changes to "Paused", and no further executions occur until I unpause

- **Given** I have a Paused workflow  
  **When** I click "Resume"  
  **Then** the trigger listener restarts and the status returns to "Active"

- **Given** I click "Delete" on any workflow  
  **When** I confirm the deletion in the confirmation dialog  
  **Then** the workflow, all its runs, and all its logs are deleted from the database, and the trigger listener is stopped immediately

- **Given** I click "Delete"  
  **When** the confirmation dialog appears  
  **Then** I see the workflow name in the dialog ("Delete 'Invoice Tracker'?") and must click "Delete permanently" to confirm — clicking outside or pressing Escape cancels

---

**US-012**: As a user, I want to be notified when a workflow fails so I can take action.

**Acceptance Criteria**:
- **Given** a workflow step fails and all 3 retries are exhausted  
  **When** the final retry fails  
  **Then** an email is sent to my registered email address within 2 minutes, containing: workflow name, the step that failed, the error message, and a link to the logs

- **Given** I receive a failure notification email  
  **When** I click the "View Logs" link in the email  
  **Then** I am taken directly to the failed run's log in the app (requires login if not already authenticated)

- **Given** I do not want email notifications  
  **When** I toggle off "Email alerts for failures" in Settings  
  **Then** no failure emails are sent for any subsequent failures

---

**US-013**: As a user, I want to view the history of all past runs for each workflow.

**Acceptance Criteria**:
- **Given** I am on the Workflow Detail screen  
  **When** I scroll to the Run History section  
  **Then** I see a table with the last 30 days of runs, each showing: date/time, status (Success/Failed/Partial), and duration

- **Given** the run history table has more than 20 entries  
  **When** I scroll to the bottom of the table  
  **Then** older runs load automatically (infinite scroll) up to the 30-day limit

- **Given** a run has status "Failed" or "Partial"  
  **When** I click that row  
  **Then** the step-by-step log for that specific run expands inline, showing which steps passed and which failed

---

### Error Handling

**US-014**: As a user, if the AI misunderstands my workflow, I want to correct it in plain English without starting over.

**Acceptance Criteria**:
- **Given** I am on the AI Confirmation screen  
  **When** I type a correction (e.g., "No, I meant send to #invoices channel, not #general")  
  **Then** the AI reprocesses the original input plus my correction and shows an updated confirmation — without losing my original description

- **Given** I correct the AI three or more times  
  **When** the AI still cannot produce a correct result  
  **Then** I see: "Let me start fresh — describe your workflow again" with the input cleared, so I can rephrase from scratch

- **Given** my correction changes which integrations are needed  
  **When** the AI shows the updated confirmation  
  **Then** the required integrations list updates to reflect the new understanding

---

**US-015**: As a user, if a workflow step fails (e.g., Slack is down), I want it to retry automatically and notify me if it still fails.

**Acceptance Criteria**:
- **Given** a workflow step encounters a transient error (network timeout, rate limit, temporary service outage)  
  **When** the error occurs  
  **Then** the step retries automatically: after 10 seconds, then 30 seconds, then 60 seconds (exponential backoff), for a maximum of 3 retries

- **Given** a step fails on all 3 retries  
  **When** the final retry fails  
  **Then** the workflow run is marked "Failed", subsequent steps are skipped and marked "Not executed", and the failure notification is triggered per US-012

- **Given** a step succeeds on retry (e.g., the second attempt works)  
  **When** viewing the run log  
  **Then** the step is marked "Success (retried 1 time)" so I can see it did not succeed on the first try

- **Given** a step fails due to a permanent error (e.g., sheet not found, invalid recipient)  
  **When** the error occurs  
  **Then** no retry is attempted — the step is immediately marked "Failed" with the specific error reason displayed in the log

---

## 6. Screen Specifications

### Screen 1: Landing Page
**Purpose**: First impression — convert visitors to sign-ups.

**Components**:
- Hero section: Headline + sub-headline + CTA button ("Start Automating Free")
- Live demo animation showing a workflow being created by typing
- 3 feature highlights (Describe → Build → Run)
- Sample workflow examples (email → sheet → slack)
- Footer with links

**Design Standard**: Dark mode, premium feel. Animated gradient backgrounds. Motion on scroll.

---

### Screen 2: Sign Up / Login
**Purpose**: Authenticate the user.

**Components**:
- "Continue with Google" button (primary CTA)
- Minimal design — single centered card
- Brand logo and tagline

**Behavior**:
- Google OAuth flow
- On first login → redirect to Onboarding
- On returning login → redirect to Dashboard

---

### Screen 3: Onboarding — Connect Your Tools
**Purpose**: Connect integrations before creating first workflow.

**Components**:
- Step indicator (Step 1 of 2: Connect Tools)
- 4 integration cards: Gmail, Slack, Google Sheets, Notion
- Each card: logo + name + "Connect" button + status (Connected / Not Connected)
- "Skip for now" option (can connect later from Settings)
- "Continue" button (enabled when at least 1 is connected)

**Behavior**:
- Each "Connect" triggers OAuth for that service
- Once authorized, card shows green checkmark
- After continuing → redirected to Create First Workflow screen

---

### Screen 4: Dashboard
**Purpose**: Home screen — overview of all workflows.

**Components**:
- Top bar: Logo, user avatar, Settings icon
- "New Workflow" button (prominent, top right)
- Workflow cards grid/list:
  - Workflow name
  - Status badge (Active / Paused / Failed)
  - Last run time
  - Run count
  - Quick actions: Pause / Run Now / Delete
- Empty state: illustrated prompt to create first workflow

**Design**: Dark background, cards with subtle glow on hover. Status badges with color coding (green/yellow/red).

---

### Screen 5: Create Workflow — Input
**Purpose**: Core experience — describe the workflow.

**Components**:
- Large, centered text area with placeholder:
  > *"Describe what you want to automate... e.g. When I get an email with an invoice, add it to my Google Sheet and send me a Slack message."*
- Suggested prompts below the input (3 clickable examples)
- "Build My Workflow" button
- Connected integrations shown as small badges (so user knows what's available)

**Design**: Minimal, focused. Single purpose screen. Soft animated background. The text area is the hero.

---

### Screen 6: AI Processing State
**Purpose**: Show the AI "thinking" in real-time.

**Components**:
- Animated AI thinking indicator
- Streaming text showing what the AI is doing:
  > *"Understanding your request..."*  
  > *"Identifying trigger: New email received..."*  
  > *"Identifying actions: Extract data → Log to Sheet → Send Slack message..."*  
  > *"Building workflow steps..."*

**Design**: This screen should feel alive. Typewriter animation for text. Subtle pulsing orb or waveform to show AI activity.

---

### Screen 7: AI Confirmation
**Purpose**: AI shows what it understood. User confirms or corrects.

**Components**:
- "Here's what I understood:" heading
- Summary in plain English:
  > *Trigger: When a new email arrives with the word "invoice"*  
  > *Step 1: Extract — sender name, amount, date*  
  > *Step 2: Add a new row to your Google Sheet "Expenses"*  
  > *Step 3: Send a Slack message to #finance with the details*
- "Looks good!" button → proceed to Visual Preview
- "Let me correct this" text field → user types correction in plain English
- AI re-processes and shows updated confirmation

---

### Screen 8: Visual Workflow Preview
**Purpose**: Show the workflow as a beautiful visual flowchart.

**Components**:
- Nodes connected by arrows:
  - Trigger node (Gmail icon + trigger description)
  - Action nodes (one per step, with integration icon + action description)
- Each node: integration logo, action name, brief description
- "Test Run" button
- "Activate" button (disabled until test is passed or skipped)
- "Edit" link → goes back to confirmation screen

**Design**: Clean node-graph. Smooth curved arrows. Nodes have soft drop shadows. Integration icons are colorful. This should look like a premium product.

---

### Screen 9: Test Run
**Purpose**: Run the workflow on real data to verify it works.

**Components**:
- "Running test..." state with animated progress
- Real-time execution log panel:
  ```
  ✅ Trigger: Found matching email — "Invoice from Acme Corp"
  ✅ Step 1: Extracted — Amount: ₹15,000 | Sender: Acme Corp | Date: Nov 4
  ✅ Step 2: Added row to Google Sheet "Expenses" — Row 24
  ✅ Step 3: Slack message sent to #finance
  ✅ Test completed successfully
  ```
- "Activate Workflow" button (after success)
- "Something's wrong? Describe the issue" (if test fails)

---

### Screen 10: Workflow Detail & Logs
**Purpose**: Monitor a specific workflow's activity.

**Components**:
- Workflow name + status badge
- Visual workflow (same as preview, read-only)
- Run History table:
  - Timestamp
  - Status (Success / Failed / Partial)
  - Duration
  - View logs link
- Expandable log view per run
- Pause / Delete actions

---

### Screen 11: Settings
**Purpose**: Manage account and integrations.

**Components**:
- Profile section (name, email, avatar)
- Connected Integrations: list with Connect/Disconnect per service
- Notification Preferences: email alerts for workflow failures
- Danger Zone: Delete Account

---

## 7. AI Behavior Specification

### 7.1 Workflow Parser Agent
**Input**: Raw natural language text from user  
**Output**: Structured workflow object

**Responsibilities**:
- Extract the **trigger** (what starts the workflow)
- Extract **actions** (what happens, in order)
- Identify which **integrations** are needed
- Detect **ambiguities** (ask for clarification)
- Map actions to available integration capabilities

**Example**:
```
Input: "When I get an email with an invoice, extract the amount 
        and add it to my sheet and ping me on Slack"

Output: {
  trigger: { type: "email_received", filter: "subject contains invoice" },
  actions: [
    { type: "extract_data", fields: ["amount", "sender", "date"] },
    { type: "sheets_append_row", sheet: "Expenses", data: ["amount","sender","date"] },
    { type: "slack_message", channel: "#general", message: "New invoice: {amount} from {sender}" }
  ]
}
```

### 7.2 Ambiguity Handler
When the parser is uncertain, it asks ONE clarifying question at a time:
> *"Which Google Sheet should I add this to? I can see: 'Expenses', 'Finance Tracker', 'Q4 Budget'"*

### 7.3 Workflow Execution Engine
- Each workflow run is **isolated** — a failure in one doesn't affect others
- Each step is **logged** with timestamp, input, output, and status
- **Retry logic**: on transient failure (network, rate limit), retry up to 3 times with exponential backoff
- **Failure notification**: if a workflow fails after retries, notify user via email

### 7.4 Error Recovery
- If a step fails, subsequent steps are skipped (not executed)
- Partial run is logged clearly: which steps succeeded, which failed, why
- User can manually re-run a failed workflow from the logs screen

---

## 8. Integration Specifications

### 8.1 Gmail
| Capability | Description |
|-----------|-------------|
| Trigger: New email | Watch inbox for new emails, with optional filters (subject, sender, label) |
| Action: Send email | Send a new email to specified recipient |
| Action: Reply to email | Reply to the triggering email |
| Action: Label email | Apply a Gmail label to the email |
| Action: Extract content | Pull subject, body, sender, attachments metadata |

### 8.2 Slack
| Capability | Description |
|-----------|-------------|
| Action: Send message | Post a message to a specified channel |
| Action: Send DM | Send a direct message to a specified user |
| Action: Create reminder | Set a Slack reminder |

### 8.3 Google Sheets
| Capability | Description |
|-----------|-------------|
| Action: Append row | Add a new row with specified data |
| Action: Update cell | Update a specific cell by row/column |
| Action: Read row | Read data from a specific row (for use in later steps) |

### 8.4 Notion
| Capability | Description |
|-----------|-------------|
| Action: Create page | Create a new page in a specified database |
| Action: Update page | Update properties of an existing page |
| Action: Create task | Add a task to a Notion database |

---

## 9. Non-Functional Requirements

| Requirement | Standard |
|-------------|---------|
| Performance | Workflow execution must start within 2 seconds of trigger |
| Reliability | 99% uptime for workflow execution engine |
| Security | OAuth tokens encrypted at rest. No email content stored permanently |
| UI Response | All UI interactions respond within 200ms |
| AI Response | Workflow parsing completes within 5 seconds |
| Scalability | MVP supports up to 50 concurrent users |
| Accessibility | WCAG 2.1 AA compliant |

---

## 10. Out of Scope (MVP)

The following are explicitly NOT in scope for MVP:

- Multi-user / team accounts
- WhatsApp, Jira, HubSpot integrations
- Workflow branching / conditional logic (if/else)
- Workflow scheduling (run every day at 9am)
- Mobile app
- Custom webhook triggers
- Billing / subscription management
- Workflow marketplace / templates

---

## 11. Decisions Log

| # | Question | Decision |
|---|----------|----------|
| Q1 | Final product name? | **FlowMind** |
| Q2 | Single user only in MVP, or allow basic team invite? | **Single user for MVP. Multi-user in Phase 2.** |
| Q3 | Should workflow logs be stored permanently or last 30 days? | **30 days retention** |

---

*All 15 user stories have full Given/When/Then acceptance criteria (v1.1)*  
*Next Phase: Test Plan — `specs/test-plan.md`*  
*Document version controlled in: `C:\Users\GENAICHNSIRUSR140.01HW2682638\Documents\Badri\specs\`*
