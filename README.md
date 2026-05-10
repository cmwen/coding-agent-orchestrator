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

## Commands

- `pnpm dev`
- `pnpm dev:runtime`
- `pnpm dev:web`
- `pnpm build`
- `pnpm typecheck`
- `pnpm test`
- `pnpm lint`
