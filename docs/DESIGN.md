# Design

## Architecture

The app has three layers:

- `packages/shared`: Zod schemas, API types, and HTTP helpers.
- `packages/store`: filesystem persistence for orchestrator sessions, jobs,
  schedules, terminal logs, attachments, and metadata.
- `apps/runtime`: Hono API, tmux orchestration, schedule runner, and static PWA
  hosting.
- `apps/web`: React PWA shell using the orchestrator-only API surface.

## Store Layout

```text
<store-root>/
  agents/
    copilot-orchestrator/
      history/
        YYYY-MM/
          <session-id>/
            SESSION.md
            ORCHESTRATOR.json
            terminal/pane.log
            delegations/<job-id>/
              JOB.json
              DONE.json
              output.log
              prompt.txt
              run.sh
              attachments/
      schedules/<schedule-id>/SCHEDULE.json
  memory/
  skills/
```

`ORCHESTRATOR.json` is the mutable session state. `SESSION.md` is a readable
manifest. `DONE.json` is the durable completion signal written by the tmux-run
script. `ORCHESTRATOR.json` can also persist an optional `providerSessionId`
used to resume provider-native CLI conversations across delegated jobs, and
each `JOB.json` records the provider session ID that was used for that run.

## tmux Model

The runtime owns one tmux session and creates one window per orchestrator
session. Each delegated job writes a shell script into the job directory and
sends `bash <run.sh>` into the target pane.

The queue is persisted first, then job artifacts are prepared, then the runtime
starts the job if the session has no running job. This prevents losing queued
work if the browser disconnects.

## Scheduler

The scheduler uses a guarded single-flight tick plus a timeout-based wake-up.
It computes the earliest enabled `nextRunAt` and sleeps until then, capped by
the configured interval. This avoids a tight backend loop while still picking
up manual schedule changes within the interval.

## Backend Loop Fix

The original polling schedule runner used a fixed interval. The new runner:

- prevents overlapping ticks with `busy`
- schedules the next timeout only after the current tick completes
- uses `unref()` so tests and short-lived tooling do not hang
- advances `nextRunAt` immediately after a schedule is triggered

## PWA Behavior

The web app is installable and caches static assets. GET API requests use a
short `NetworkFirst` cache. SSE stream endpoints are excluded from service
worker caching.

## Web UX Architecture

The orchestrator UI ships a responsive **Design 03** shell with desktop
power-user navigation and a mobile queue-first board:

- **Desktop**
  - persistent session rail
  - command palette (`Cmd/Ctrl+K`)
  - workspace navigation for Delegate, Terminal, Queue, Changes, Schedules,
    and Settings
- **Mobile**
  - compact session picker rail
  - active-session Home hub with quick session switching
  - Home queue board for running, queued, failed, and scheduled work
  - Settings keeps session defaults and automation shortcuts together
  - bottom navigation for Delegate, Terminal, Changes, and Settings

### State ownership

- `App.tsx` owns workspace loading, selected session persistence, theme, command
  palette state, and API mutations.
- `OrchestratorPane.tsx` owns session-local UI state for create/edit flows,
  queue visibility, working tree inspection, terminal streaming, and responsive
  workspace navigation.

### Behavior parity guarantees

The shipped UI keeps these behaviors intact:

- selected-session gating for delegation, terminal, changes, and schedules
- one attachment per delegated task
- optional provider session continuation during session creation and per-task
  override during delegation
- tmux streaming, reconnect, load-more history, cancel, and restart
- queue retry/remove/continue actions
- schedule create/edit/pause/resume/delete and delivery status
- working tree status plus structured diff inspection

## Master Session

A `role: "master"` session variant that has full awareness of all peer sessions.
The runtime injects a dynamic `master-context.md` into the agent's system prompt
so it can produce cross-session delegation plans. Batches are persisted in
`master-batches/<batch-id>/BATCH.json` before any job is queued, ensuring
durability through restarts. Dispatched jobs carry `masterBatchId` and
`masterItemId` fields in their `JOB.json` for traceability.

Full design, UX wireframes, and technical spec: [`MASTER-SESSION.md`](./MASTER-SESSION.md).
