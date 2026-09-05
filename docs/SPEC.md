# Product Spec

## Goal

Provide a personal local PWA for orchestrating Coding Agent CLI work across
multiple tmux-backed sessions. The app should make it easy to create project
workspaces, delegate queued jobs, observe live terminal output, inspect working
tree changes, browse repository folders, preview file content, and run recurring
scheduled tasks.

## Non-Goals

- General chat UI
- Dependency on `min-kb-store`
- Hosted multi-user deployment
- Remote authentication or authorization

## Master Session

A privileged session type that has real-time awareness of all other sessions and
can coordinate cross-session delegation from a single natural-language prompt.
Full design, UX flows, and technical spec: [`MASTER-SESSION.md`](./MASTER-SESSION.md).

## Users

Single local user on a trusted machine or private network.

## Core Workflows

1. Create an orchestrator session for a project path and purpose.
2. Pick a CLI provider, model, and execution mode.
3. Select an active session from the desktop rail or the mobile Home/session picker.
4. Delegate a prompt, optionally with one attachment and a per-task continuation override.
5. Watch tmux output stream live in the desktop terminal view or mobile terminal surface.
6. Queue more work while a job is running, then retry, continue, or remove tasks from the queue.
7. Cancel or restart stuck tmux sessions.
8. Create daily, weekly, or monthly scheduled jobs with timezone, delivery, and pause/resume controls.
9. Inspect uncommitted project changes and diffs from the Changes workspace.
10. Browse project folders and preview files from the Files workspace.
11. Use the desktop command palette to jump to high-frequency workspace actions.

## Codex quota-aware execution

Codex is a special case because `codex app-server` exposes included usage as two
rolling rate-limit windows: a primary window (normally 5 hours) and a secondary
window (normally 7 days/weekly). The runtime reads these windows through
`account/rateLimits/read`; the UI presents their used/remaining percentages and
reset times. Window duration metadata is used when present, with the primary
and secondary roles as the compatibility fallback.

For a queued Codex job, the runtime checks the latest available snapshot before
launching the prompt. If either included window is exhausted and has a future
reset, the job remains queued and persists `deferredUntil` plus `deferReason`.
The scheduler reconciles sessions independently of SSE/browser clients, so a
deferred prompt is eligible again after a runtime restart and after the reset.
Purchased credits are informational and are not silently spent to avoid this
included-window wait.

When a started Codex job exits with recognizable usage/rate-limit output, the
runtime removes its completion marker, records `interruptedAt`, re-queues it,
and preserves its provider session ID. Once allowance returns, the job uses
`codex exec resume <thread>` so it continues the same Codex conversation rather
than creating a new thread.

## Acceptance Criteria

- The app runs without `min-kb-store`.
- Runtime and web dev servers use new ports: `8791` and `5181`.
- Sessions survive browser reloads and runtime restarts.
- Multiple sessions map to distinct tmux windows.
- Queued jobs start only when no job is running in the target session.
- Schedules do not create duplicate runs while the scheduler is busy.
- Desktop uses a persistent session rail, command palette, and workspace tabs.
- Mobile uses a compact session picker, an active-session Home hub, a Home queue board, and bottom navigation.
- Delegate, Terminal, Changes, Files, and Schedules remain scoped to the selected session.
- PWA assets and GET API cache rules exclude SSE streams.
- Codex 5-hour and weekly windows are read from app-server and shown with reset
  times in Credits.
- An exhausted included Codex window defers queued prompts until its reset;
  deferral metadata is persisted and survives runtime restart.
- A deferred or rate-limited Codex job resumes the same provider thread after
  allowance returns, including when the browser is disconnected.
- Codex purchased-credit balances remain informational and are not consumed by
  automatic queue recovery.
