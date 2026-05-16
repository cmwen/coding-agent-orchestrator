# Coding Agent CLI Orchestrator

Local-first PWA for running multiple Coding Agent CLI sessions through tmux.

This app is distilled from `min-kb-app` but removes the chatbox and `min-kb-store`
dependency. The main implementation still uses tmux windows and panes for
long-running delegated jobs, while sessions and schedules are saved in a new
filesystem store.

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

Orchestrator sessions can now persist an optional **provider session ID** so
future delegated jobs can continue the same CLI conversation instead of starting
from scratch.

- **Copilot**: new orchestrator sessions bootstrap the first delegated job with
  a stable session name, then capture the real Copilot session ID from CLI
  output so later delegated jobs can resume the exact prior Copilot session.
- **Gemini, Codex, OpenCode**: paste an existing provider session ID into the
  orchestrator create/settings UI to continue that external CLI session on
  future delegated jobs.
- **Codex** continuation uses the `codex resume` flow under the hood; the other
  supported providers use their resume/session flags directly.
- Clear the provider session ID in session settings to stop targeting a pasted
  external session. For Copilot, clearing the field falls back to the
  orchestrator session ID again.
- The orchestrator task queue shows the provider session ID used for each job so
  you can verify what context a run is attached to.

## Commands

- `pnpm dev`
- `pnpm dev:runtime`
- `pnpm dev:web`
- `pnpm build`
- `pnpm typecheck`
- `pnpm test`
- `pnpm lint`
