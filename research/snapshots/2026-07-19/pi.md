# Pi Coding Agent

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time / tier | `2026-07-19T12:00:00+10:00` / candidate |
| Vendor / version | Mario Zechner / `0.76.0` installed |
| Install / environment / auth | npm `@earendil-works/pi-coding-agent`; [shared](./METHODOLOGY.md); not-tested |
| Source | Open source, MIT |

## Executive finding

Pi is a top integration candidate: strict JSONL RPC, SDK embedding, JSON event
mode, exact session selection, caller-chosen IDs and fork. Its intentionally
minimal core has no approval prompts or built-in sandbox, so the orchestrator
must supply isolation and policy.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | CLI output | `pi --version`; `pi --help` | Version, modes, sessions, models, tools |
| E2 | official source | [Coding-agent README](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/README.md) | Strict JSONL RPC, SDK, extensions, exact session/fork |

## Capability snapshot

| Area | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Install/source/platform/update | yes | E1-E2 | npm; `pi update --self`; Node platforms |
| Interactive/headless/arg/stdin/file/non-TTY | yes | E1-E2 | `pi`; `pi -p`; stdin; `@file` |
| JSON stream/schema/events/final IDs | yes | E1-E2 | `--mode json`; strict LF JSONL RPC; SDK typed events |
| Exit/signal/timeout/restart | partial | E2 | RPC control exists; exact matrix not-tested |
| Sessions/list/latest/exact/fork/export | yes | E1-E2 | `-c`; `--session {id}`; `--session-id`; `--fork`; `--export` |
| Cross-dir/machine/compaction/upgrades | partial | E2 | custom session dir/export; compaction extension; durability not-tested |
| Models/reasoning/BYOK/local/auth | yes | E1-E2 | provider/model/API key, OpenAI-compatible and local provider extensions |
| Per-run tokens/cost | yes | E2 | event/session usage; observed auth not-tested |
| Account credits/quota | not-applicable | E2 | multi-provider harness; query each upstream |
| Hooks/extensions/skills/agents/MCP | partial | E2 | rich extensions/skills; MCP and subagents are extensions, not core |
| SDK/RPC/permissions/sandbox | partial | E2 | excellent SDK/RPC; isolation/approval intentionally external |
| Git/checkpoint/images/logs/offline | partial | E1-E2 | images, offline flag; other features extension-dependent |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | SDK for Node; RPC for process isolation |
| Launch / resume | `pi --mode rpc --session-id {uuid}` / RPC load `{sessionId}` then prompt |
| Session/parser | caller ID; strict LF JSONL, correlate request/event IDs and terminal response |
| Credits | per-run events plus provider-specific collectors |
| Cancellation/recovery | RPC abort/close; persist session directory and exact ID |
| Security / complexity / recommendation | disposable sandbox required; medium; candidate |

### App delta and proposed tests

Add a provider adapter independent of tmux screen text. Contract-test LF framing
(including Unicode line separators), RPC initialize/prompt/cancel, caller IDs,
fork, crash recovery, offline mode, disabled extensions and external sandboxing.

## Unknowns and next verification

Run an unauthenticated fake-provider RPC fixture to pin protocol version, final
markers, usage fields and recovery without exposing a real credential.

