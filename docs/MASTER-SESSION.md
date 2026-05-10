# Master Session

## Overview

A **Master Session** is a privileged orchestrator session that has real-time
awareness of every other session in the system and can delegate cross-session
work from a single natural-language prompt.

Where a standard session delegates tasks to one coding agent CLI running in one
tmux window, the Master Session acts as a top-level coordinator. You describe a
feature or change that spans multiple project directories, and the Master Session
analyses each affected session's context, drafts per-session delegation prompts,
presents a plan for review, and dispatches the approved delegations — all from
one place.

---

## UX Design

### Mental Model

Think of the existing sessions as workers and the Master Session as a tech lead.
You tell the tech lead what you need. It reads each worker's project path and
running context, breaks the work into discrete tasks, assigns each task to the
right worker, and monitors progress. You can approve, edit, or skip individual
assignments before they run.

### Sidebar Treatment

The Master Session always appears **pinned at the top** of the session sidebar,
above the chronological session list. It is visually differentiated:

- A ⬡ hexagon "control" icon instead of the standard circle status dot.
- Label: **Master** in a slightly heavier weight with a muted accent tint.
- A live `N sessions active` count badge that updates via the SSE stream.
- Cannot be deleted from the UI (only archived).

### Master Session Panel Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  ⬡ Master Session                            [Sessions: 4]  [⚙ …]  │
├────────────────────────┬─────────────────────────────────────────────┤
│  SESSION GRID          │  TERMINAL / DELEGATION PLAN                 │
│                        │                                             │
│  ● Session A  running  │  ┌─ Delegation Plan ──────────────────────┐│
│    ~/projects/api      │  │  ✦ Session A — add /users endpoint     ││
│    Last: 2 min ago     │  │  ✦ Session B — update shared types     ││
│                        │  │  ✦ Session C — update API docs         ││
│  ● Session B  idle     │  │                                         ││
│    ~/projects/shared   │  │  [Approve All]  [Review Each]  [Cancel] ││
│                        │  └─────────────────────────────────────────┘│
│  ● Session C  idle     │                                             │
│    ~/projects/docs     │  ┌─ Live Terminal ─────────────────────────┐│
│                        │  │  copilot> Analysing session contexts…   ││
│  ○ Session D  missing  │  │  copilot> Plan ready. Awaiting approval ││
│    ~/projects/mobile   │  └─────────────────────────────────────────┘│
│                        │                                             │
│  [+ New Session]       │  ┌─ Prompt ─────────────────────────────── ┐│
│                        │  │  Add a /users POST endpoint, update the ││
│                        │  │  shared types, and sync the API docs.   ││
│                        │  │                              [Delegate ▶]││
│                        │  └─────────────────────────────────────────┘│
└────────────────────────┴─────────────────────────────────────────────┘
```

On **mobile**, the session grid collapses into a horizontal scrollable strip of
session chips above the terminal. The delegation plan slides up as a bottom
sheet before dispatch.

### Delegation Flow

#### Step 1 — Prompt

The user types a high-level instruction in the prompt box, the same way a normal
job delegation works. Example:

> "Add a /users POST endpoint, update the shared types package, and sync the API
> docs site."

Optionally attach a file (e.g. a Figma export, an OpenAPI spec) exactly as with
normal jobs.

#### Step 2 — Context Collection (automatic)

Immediately on submit, the Master Session's tmux agent:

1. Reads each known session's `SESSION.md` and `ORCHESTRATOR.json` to learn the
   project path, purpose, and current status.
2. Optionally performs a shallow `git status` / `git log -1` for each session to
   surface the latest branch and dirty state.
3. Synthesises this as a structured context block injected into its system
   prompt.

The terminal pane shows live progress: "Collecting context for 4 sessions…"

#### Step 3 — Planning

The agent produces a **Delegation Plan** — a JSON list of per-session tasks:

```json
[
  {
    "sessionId": "2025-05-api",
    "sessionTitle": "API Service",
    "prompt": "Add a POST /users endpoint to the Express router. Follow the
               existing pattern in routes/products.ts. Validate with zod.",
    "confidence": "high",
    "reason": "This session owns the API service where the route must be added."
  },
  {
    "sessionId": "2025-05-shared",
    "sessionTitle": "Shared Types",
    "prompt": "Export a CreateUserRequest type from packages/shared/src/index.ts.
               It should match the zod schema the API team will add.",
    "confidence": "high",
    "reason": "The shared types package must export the new DTO."
  },
  {
    "sessionId": "2025-05-docs",
    "sessionTitle": "API Docs",
    "prompt": "Document the new POST /users endpoint in docs/endpoints.md.
               Include request body, response codes, and an example curl.",
    "confidence": "medium",
    "reason": "Docs session tracks the public API surface."
  }
]
```

This plan is rendered in the **Delegation Plan** panel. Each item shows:

- Target session name + status badge.
- The drafted prompt (editable inline).
- A confidence badge (`high` / `medium` / `low`) and the agent's reasoning
  (expandable).
- Per-item actions: **✓ Approve**, **✎ Edit**, **✗ Skip**.

#### Step 4 — Review & Approval

Two top-level actions:

| Button | Behaviour |
|--------|-----------|
| **Approve All** | Queue all `high` + `medium` items immediately. Skips `low`. |
| **Review Each** | Step through each item one by one with approve/edit/skip. |
| **Cancel** | Discard the plan. Nothing is queued. |

A global **Auto-approve** toggle (in session settings) skips the review step
entirely and dispatches all items rated `high` or above immediately after
planning.

#### Step 5 — Dispatch & Monitoring

Approved items are queued into each target session's job queue via the existing
`POST /api/orchestrator/sessions/:sessionId/jobs` endpoint.

The session grid in the left panel refreshes live. Each session card shows its
current status and a "dispatched from master" badge on the active job so the
user knows which jobs originated from this delegation.

A **Delegation History** drawer (accessible via ⚙) shows all past master
delegations with their per-session status rollup (all-done / partial /
some-failed).

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+M` | Focus master session from anywhere |
| `Ctrl+Enter` | Submit prompt in master panel |
| `A` (in plan review) | Approve focused item |
| `E` (in plan review) | Edit focused item inline |
| `S` (in plan review) | Skip focused item |
| `Shift+A` | Approve all |

---

## Architecture & Technical Spec

### Session Schema Changes

Add a `role` discriminator to `OrchestratorSession`:

```ts
// packages/shared/src/index.ts

export const orchestratorSessionRoleSchema = z.enum(["standard", "master"]);
export type OrchestratorSessionRole = z.infer<
  typeof orchestratorSessionRoleSchema
>;

// Added to orchestratorSessionSchema:
role: orchestratorSessionRoleSchema.default("standard"),
```

**Constraints:**

- Exactly one `master` session may exist at a time. The runtime enforces this:
  creating a second master returns `409 Conflict`.
- A master session cannot be selected as a delegation target by another master
  session.

### Store Changes

A master delegation batch is a new first-class entity persisted alongside jobs:

```
agents/copilot-orchestrator/
  history/YYYY-MM/<master-session-id>/
    SESSION.md
    ORCHESTRATOR.json
    terminal/pane.log
    delegations/<job-id>/         ← standard per-job artifacts (unchanged)
    master-batches/<batch-id>/
      BATCH.json                  ← delegation plan + approval state
      plan.md                     ← human-readable plan (written by agent)
```

**`BATCH.json` schema:**

```ts
interface MasterBatch {
  batchId: string;
  createdAt: string;
  completedAt?: string;
  status: "planning" | "awaiting-approval" | "dispatched" | "done" | "cancelled";
  originalPrompt: string;
  attachmentId?: string;
  items: MasterBatchItem[];
}

interface MasterBatchItem {
  itemId: string;
  sessionId: string;
  jobId?: string;          // set after dispatch
  prompt: string;
  confidence: "high" | "medium" | "low";
  reason: string;
  approval: "pending" | "approved" | "edited" | "skipped";
  editedPrompt?: string;   // set if user edited the prompt
  status: "pending" | "queued" | "running" | "completed" | "failed" | "skipped";
}
```

### Master Session Bootstrap

The master session is created via the standard
`POST /api/orchestrator/sessions` endpoint with `role: "master"`.

On creation the runtime:

1. Ensures no other master session exists (returns 409 otherwise).
2. Creates the tmux window with a **master system context** injected as
   `--system-prompt-file` (Copilot CLI) or equivalent.
3. Registers the master session as `role: "master"` in `ORCHESTRATOR.json`.

The **master system context** (`master-context.md`) is a dynamically generated
markdown file written to the master session's store directory at startup and
refreshed every time a delegation plan is requested. It includes:

```markdown
# Master Orchestrator Context

You are the Master Orchestrator for a multi-session coding environment.

## Known Sessions

| ID | Title | Project Path | Purpose | Status | Branch |
|----|-------|-------------|---------|--------|--------|
| 2025-05-api | API Service | ~/projects/api | REST API | idle | main |
| 2025-05-shared | Shared Types | ~/projects/shared | TS types package | idle | main |
| 2025-05-docs | API Docs | ~/projects/docs | Documentation site | idle | main |

## Your Job

When the user gives you a high-level task:
1. Read each session's project path and purpose.
2. Determine which sessions need to act and draft a precise prompt for each.
3. Output a delegation plan as a JSON block labelled ```delegation-plan```.
4. Wait for the user to approve, edit, or skip each item before dispatching.

## Dispatch Tool

To queue a job to a specific session, emit a tool call:
  dispatch_job(sessionId, prompt)

The runtime intercepts this and calls POST /api/orchestrator/sessions/:id/jobs.
```

### New API Endpoints

```
# Master session management
GET  /api/orchestrator/master               — returns the current master session or 404
POST /api/orchestrator/master               — bootstrap or re-initialise the master session

# Delegation batches
GET  /api/orchestrator/sessions/:id/batches          — list master batches for a session
POST /api/orchestrator/sessions/:id/batches          — create a new batch (planning phase)
GET  /api/orchestrator/sessions/:id/batches/:batchId — fetch batch + item status
PATCH /api/orchestrator/sessions/:id/batches/:batchId — update approval state / dispatch
DELETE /api/orchestrator/sessions/:id/batches/:batchId — cancel a batch

# Session grid data (for the left panel)
GET  /api/orchestrator/master/sessions-overview      — all sessions with live status,
                                                        last job summary, branch,
                                                        dirty state; used to populate
                                                        the session grid in the UI
```

### Context Refresh Protocol

The runtime exposes a **context refresh** mechanism so the master session's
agent always has up-to-date peer-session info without polling:

1. The web client subscribes to `GET /api/orchestrator/master/sessions-overview`
   as a short-lived SSE stream.
2. When any session changes status, the runtime broadcasts an update event.
3. The client re-renders the session grid.
4. Before triggering a delegation plan, the client calls
   `POST /api/orchestrator/sessions/:id/batches` with `action: "refresh-context"`,
   which causes the runtime to re-write `master-context.md` and send
   `keys -t <master-pane> ""` to the agent to pick up the new file.

### Runtime Guard: Self-Delegation Prevention

When a batch item targets a session, the runtime checks:

- The target session is not the master session itself → reject with 400.
- The target session exists → reject with 404 if missing.
- The target session is not `missing` status (tmux window gone) → warn in plan,
  still allow dispatch.

### tmux Integration

The master session tmux window follows the same lifecycle as standard sessions
(one window, one pane). The additional behaviour:

- The `run.sh` script for a master-originated job includes a comment header:
  `# Dispatched by Master Session <batchId>/<itemId>`.
- `JOB.json` for such jobs includes `"masterBatchId"` and `"masterItemId"` fields.
- `DONE.json` completion is caught by the standard job watcher; the batch item
  status is updated as a side-effect via `updateMasterBatchItem`.

### Skills Plugin: `master-orchestrator`

A new skill named `master-orchestrator` is auto-installed into the master
session's skill directory at startup. It provides the agent with:

- `list_sessions` — returns the current sessions overview JSON.
- `read_session_context` — reads a session's `SESSION.md` and recent terminal
  tail for deep context.
- `dispatch_job(sessionId, prompt, [attachment])` — queues a job via the API;
  returns the new job ID.
- `get_batch_status(batchId)` — returns the current batch item statuses.

This skill is a standard Copilot CLI plugin skill file (markdown with tool
definitions), placed at:

```
agents/copilot-orchestrator/skills/master-orchestrator/plugin.md
```

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| 1 | Exactly one master session can exist. Attempting a second returns 409. |
| 2 | Master session is pinned to the top of the sidebar with distinct icon and badge. |
| 3 | Master panel shows a live session grid with status, project path, and last-job summary. |
| 4 | Submitting a prompt triggers context collection and produces a delegation plan. |
| 5 | Delegation plan items are editable inline before dispatch. |
| 6 | Approve All dispatches `high`/`medium` confidence items; skips `low`. |
| 7 | Auto-approve mode dispatches immediately without the review step. |
| 8 | Dispatched jobs appear in each target session's job queue with `masterBatchId`. |
| 9 | BATCH.json is persisted before any jobs are queued (durable through restarts). |
| 10 | Master session cannot dispatch to itself (returns 400 in API). |
| 11 | Delegation history drawer lists past batches with rolled-up status. |
| 12 | Mobile layout renders session chips + bottom-sheet plan review. |
| 13 | SSE session-overview stream updates the grid without page reload. |
| 14 | `master-orchestrator` skill is auto-installed and listed in agent summary. |
| 15 | The `Ctrl+M` shortcut focuses the master panel from anywhere in the app. |

---

## Non-Goals (this iteration)

- Automatic re-planning when a dispatched job fails (manual retry only).
- Multi-master hierarchies.
- Master session scheduling (use regular schedules for that).
- Cross-machine / remote session targeting.
