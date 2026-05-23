# Product Spec

## Goal

Provide a personal local PWA for orchestrating Coding Agent CLI work across
multiple tmux-backed sessions. The app should make it easy to create project
workspaces, delegate queued jobs, observe live terminal output, inspect working
tree changes, and run recurring scheduled tasks.

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
10. Use the desktop command palette to jump to high-frequency workspace actions.

## Acceptance Criteria

- The app runs without `min-kb-store`.
- Runtime and web dev servers use new ports: `8791` and `5181`.
- Sessions survive browser reloads and runtime restarts.
- Multiple sessions map to distinct tmux windows.
- Queued jobs start only when no job is running in the target session.
- Schedules do not create duplicate runs while the scheduler is busy.
- Desktop uses a persistent session rail, command palette, and workspace tabs.
- Mobile uses a compact session picker, an active-session Home hub, a Home queue board, and bottom navigation.
- Delegate, Terminal, Changes, and Schedules remain scoped to the selected session.
- PWA assets and GET API cache rules exclude SSE streams.
