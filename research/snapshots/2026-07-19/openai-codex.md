# OpenAI Codex CLI

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time | `2026-07-19T12:00:00+10:00` |
| Researcher / tier | OpenAI Codex / supported |
| Vendor / version | OpenAI / `codex-cli 0.144.4` installed |
| Install / environment | npm or release binary; [shared environment](./METHODOLOGY.md) |
| Authentication | existing auth not exercised |
| Source | Open source, Apache-2.0 |

## Executive finding

Codex has a strong JSONL headless CLI and exact-ID resume, plus a richer
versioned app-server protocol suitable for durable orchestration. The app's new
run is structured, but its resume command currently omits `--json`. The existing
app-server rate-limit RPC is the best account-credit collector.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | CLI output | `codex --version`; `codex --help`; `codex exec --help`; `codex exec resume --help` | Version, JSONL, exact resume, sandbox/model/local flags |
| E2 | official docs | [Non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode) | `codex exec`, JSONL and CI behavior |
| E3 | official docs | [App Server](https://learn.chatgpt.com/docs/app-server) | JSON-RPC lifecycle, threads, events and rate limits |
| E4 | official source | [Repository](https://github.com/openai/codex) | Source/license/releases |

## Installation, CLI, and structured output

| Capability | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Install/version/update/cross-platform/source | yes | E1,E4 | `codex --version`; `codex update`; Apache-2.0 |
| Interactive / headless / arg/stdin/file | yes | E1-E2 | `codex`; `codex exec {prompt}`; `-`; `--output-schema {file}` |
| Non-TTY / JSONL / error/final events | yes | E1-E3 | `codex exec --json`; app-server notifications |
| Exit/stdout/signal/timeout | partial | E1-E3 | process and turn interrupt exist; exact exit matrix not-tested |
| Server/daemon/reconnect | experimental | E1,E3 | `app-server`, remote control, exec-server |

## Sessions, models, auth, and economics

| Capability | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Canonical ID in output / exact resume | yes | E1-E3 | thread ID event; `codex exec resume {id} {prompt} --json` |
| Continue latest / list/archive/delete/fork | yes | E1 | `--last`; top-level archive/delete/fork commands |
| Cross-directory / cross-machine | partial | E1,E3 | `--all` bypasses cwd filter; app server remote is experimental |
| Compaction / upgrade durability | yes | E3 | compaction and stored threads documented; upgrade probe not-tested |
| Model/reasoning/API key/subscription/local | yes | E1-E3 | `--model`; config effort; login/API key; `--oss` LM Studio/Ollama |
| Per-run token/cost | yes | E2-E3 | usage events |
| Account quota/credits/reset/plan | yes | E3 | app-server rate-limit RPC; existing collector, auth not re-probed |

## Automation, workspace, and operations

| Capability | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Hooks/plugins/skills/AGENTS/subagents | yes | E1-E3 | current CLI/docs surfaces |
| MCP / SDK / app server | yes | E1-E3 | MCP server and app server; SDK available |
| Approval/sandbox/allow-deny | yes | E1-E3 | read-only/workspace-write/full access; rules/profiles |
| Git/worktree/checkpoints/images/browser | partial | E1-E3 | image input and git workflows; exact undo matrix not-tested |
| Logs/telemetry/retries/recovery | yes | E1-E3 | doctor, events, interrupt and thread resume |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | app server; JSONL CLI fallback |
| Launch new | `codex exec --json --model {model} -` with prompt on stdin |
| Resume by ID | `codex exec resume --json --model {model} {sessionId} {prompt}` |
| Session/parser | capture `thread_id`; parse typed JSONL and terminal turn event |
| Credits | app-server rate-limit RPC; 60-second cache and no credential export |
| Cancellation/recovery | app-server turn interrupt or signal; reconnect and read thread |
| Security / complexity / recommendation | workspace sandbox+rules; medium; supported |

### App delta and proposed tests

Add `--json` to resume, replace unconditional
`--dangerously-bypass-approvals-and-sandbox` with a sandbox/profile, and prefer
stdin over shell-quoted prompts. Contract-test new/resume JSONL equivalence,
thread capture, error/retry events, cancellation, compaction and rate-limit RPC.

## Unknowns and next verification

Probe exact signal exit codes, app-server protocol negotiation, cross-version
thread durability and rate-limit fields on each supported authentication mode.

