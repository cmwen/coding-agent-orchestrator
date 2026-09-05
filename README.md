# Coding Agent CLI Orchestrator

Local-first PWA for running multiple Coding Agent CLI sessions through tmux.

This app is distilled from `min-kb-app` but removes the chatbox and `min-kb-store`
dependency. The main implementation still uses tmux windows and panes for
long-running delegated jobs, while sessions and schedules are saved in a new
filesystem store.

## UX model

The web app now ships the responsive **Design 03** shell:

- **Desktop:** session rail + command palette + workspace views for Delegate,
  Terminal, Queue, Changes, Schedules, provider Credits, and session settings.
- **Mobile:** compact session picker rail + active-session **Home** hub with
  queue lanes, quick session switching, and bottom navigation for Delegate,
  Terminal, Changes, Credits, and Settings.
- **Behavior parity:** the UI preserves session-scoped delegation,
  single attachments, tmux streaming and reconnect, queue retry/remove/continue
  actions, working tree inspection, and schedule CRUD.

Reference design artifacts:

- `docs/ux-proposals/proposal-03-mobile-ops.html`
- `docs/ux-proposals/wireframe-03-mobile-ops.html`

## Stack

- pnpm workspaces
- TypeScript
- Hono runtime host
- React + Vite PWA
- tmux-backed job execution
- Vitest

## Workspace

```text
apps/
  runtime/  Local HTTP API and static web host
  web/      PWA orchestrator UI
packages/
  shared/   API contracts and schemas
  store/    Filesystem store for sessions, jobs, schedules, and logs
docs/
  SPEC.md
  DESIGN.md
  API.md
  CONFIGURATION.md
  MASTER-SESSION.md
```

## Quick Start

```bash
pnpm install
pnpm build
pnpm dev
```

Default ports:

- runtime API: `http://localhost:8791`
- Vite web dev server: `http://localhost:5181`

The runtime serves the built web app after `pnpm build`. During development,
the Vite server proxies `/api` to the runtime.

## Requirements

- `tmux`
- at least one supported CLI backend:
  - `copilot`
  - `gemini`
  - `codex`
  - `opencode`
  - `agy` (Google Antigravity CLI)
  - `grok` (Grok Build; the legacy `grok-build` binary name is also detected)

CLI availability is discovered at runtime and shown in the new-session provider
picker. Missing providers remain visible with their required command, so adding a
backend does not require guessing why it is unavailable. Provider descriptors,
binary detection, and conversation-resume capabilities live in
`apps/runtime/src/cli-providers.ts`.

## Provider credits dashboard

The **Credits** workspace gives every configured CLI provider a consistent card
without treating unlike billing systems as interchangeable:

- **Copilot:** live quota snapshots from the local Copilot JSON-RPC server.
- **Codex:** live plan rate limits, reset time, and purchased-credit balance
  from `codex app-server`.
- **OpenCode:** 30-day local token, cost, and session statistics. OpenCode can
  route to many upstream providers, so this is intentionally not labeled as a
  subscription balance.
- **Antigravity:** a direct path to its interactive `/usage` (or `/quota`)
  workflow, which refreshes per-model quotas.
- **Grok Build:** a link to Grok Settings → Usage for the shared weekly
  SuperGrok pool and extra-credit balance.
- **Gemini:** quota guidance for remaining Standard/Enterprise users and the
  consumer migration path to Antigravity.

Provider checks run concurrently only when Credits is opened. Results are
single-flight cached in the runtime for 60 seconds; **Refresh usage** bypasses
the cache. A failed provider check never blocks the other cards or coding jobs.

### Codex allowance-aware queueing

Codex usage is read from the local `codex app-server` rate-limit endpoint. The
dashboard identifies the two included rolling windows (the usual 5-hour and
7-day/weekly windows), shows each reset time, and reports the next safe prompt
time when an exhausted window has a reset timestamp.

Before starting a queued Codex job, the runtime checks those windows. If an
included window is exhausted, the prompt stays persisted in the queue with
`deferredUntil` and `deferReason`; it is not sent to Codex until the reset. The
scheduler periodically reconciles sessions, so this also works with no browser
connected. Queue state and deferral fields survive runtime restarts.

If Codex reports a usage/rate-limit failure after a job starts, the runtime
clears its completion marker, re-queues it for the reported reset, and resumes
the saved provider conversation with `codex exec resume <thread>` when it runs
again. Purchased credits are displayed separately and are not automatically
spent to bypass an included-window deferral.

## Local Store

By default, the store is created at:

```text
~/.local/share/coding-agent-orchestrator
```

Override it with:

```bash
export CODING_AGENT_ORCHESTRATOR_STORE_ROOT=/absolute/path/to/store
```

The app creates these base folders automatically:

```text
agents/
memory/
skills/
```

Orchestrator sessions are stored under:

```text
agents/copilot-orchestrator/history/YYYY-MM/<session-id>/
```

## Session continuation

Orchestrator sessions persist an optional **provider session ID** so future
delegated jobs continue the same CLI conversation instead of rebuilding context
from scratch. Reuse is enabled by default for new and existing orchestrator
sessions and can be disabled in session settings for isolated one-shot tasks.

- **Copilot, Gemini, and Grok Build**: the first job is assigned a UUID up front;
  later jobs resume that exact provider session.
- **Codex, OpenCode, and Antigravity**: the runtime discovers the provider ID
  from the first job's output, saves it, and late-binds already queued follow-up
  jobs before they start.
- Paste an existing provider session ID while creating or editing an
  orchestrator session to continue it immediately. The delegate form also
  accepts a one-task session ID override.
- **Codex** continuation uses `codex exec resume`; other providers use their
  documented resume/session flags.
- Turn off **Continue this coding agent session** to leave the saved ID intact
  while making future jobs start fresh by default.
- The orchestrator task queue shows the provider session ID used for each job so
  you can verify what context a run is attached to.
- Codex quota-deferred jobs are labeled as waiting for allowance and show their
  planned resume time when available.

## Commands

- `pnpm dev`
- `pnpm dev:runtime`
- `pnpm dev:web`
- `pnpm build`
- `pnpm typecheck`
- `pnpm test`
- `pnpm lint`
