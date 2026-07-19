# xAI Grok Build

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time | `2026-07-19T12:00:00+10:00` |
| Researcher / tier | OpenAI Codex / supported |
| Vendor / version | xAI / `grok 0.2.103 (89c3d36fb6)` installed |
| Install / environment | official installer/Homebrew; [shared environment](./METHODOLOGY.md) |
| Authentication | not-tested |
| Source | Closed CLI; official documentation |

## Executive finding

Grok Build now has headless JSON/streaming JSON, exact-ID resume, caller-chosen
new UUIDs, ACP stdio, server modes, plugins and worktrees. This is substantially
stronger than a tmux/plain-text integration. The CLI distinguishes new
`--session-id` from resume `--resume`; the app handles that distinction correctly
but omits structured output.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | CLI output | `grok --version`; `grok --help`; `grok agent --help` | Version, JSON, session, ACP/server, policy/worktree flags |
| E2 | official docs | [CLI reference](https://docs.x.ai/build/cli/reference) | Exact command semantics; updated 2026-07-04 |
| E3 | official docs | [Grok Build overview](https://docs.x.ai/build/overview) | Install, headless, custom OpenAI-compatible models |

## Installation, CLI, and structured output

| Capability | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Install/version/update/cross-platform | yes | E1-E3 | `grok version`; `grok update`; macOS/Linux/WSL/Windows |
| Interactive / headless / arg/file/JSON prompt | yes | E1-E3 | `grok`; `-p`; `--prompt-file`; `--prompt-json` |
| stdin | unknown | E1-E3 | ACP stdio yes; prompt stdin not established |
| JSON / streaming JSON / final events | yes | E1-E3 | `--output-format json|streaming-json`; schema not copied |
| Timeout/max turns/signals | partial | E1 | `--max-turns`; signal behavior not-tested |
| ACP/server/leader | yes | E1-E2 | `grok agent stdio|serve|leader` |

## Sessions, models, auth, and economics

| Capability | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Caller new UUID / exact resume / latest | yes | E1-E2 | `--session-id {uuid}`; `--resume {id}`; `--continue` |
| List/search/delete/export/fork | yes | E1-E2 | sessions commands; export; `--fork-session` |
| Worktree/cross-dir/upgrade retention | partial | E1-E2 | `--cwd`, worktree restore; compatibility not-tested |
| Model/reasoning/BYOK/OpenAI-compatible | yes | E1-E3 | `-m`, `--effort`, custom base URL/env key |
| Subscription/API auth | yes | E1-E3 | OAuth/device code/API key |
| Per-run tokens/cost / account balance | unknown | E1-E3 | structured telemetry and usage UI not verified |

## Automation, workspace, and operations

| Capability | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Agents/subagents/plugins/skills/hooks/MCP | yes | E1-E3 | inspectable configuration; plugin marketplace |
| ACP/server/permissions/sandbox | yes | E1-E2 | explicit allow/deny modes and sandbox profiles |
| Git/worktrees/images/browser/memory | partial | E1-E3 | worktrees, prompt JSON, web tools and memory; image schema not-tested |
| Logs/traces/recovery | yes | E1-E2 | debug file, trace export, leader and resume |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | ACP stdio or agent server; streaming CLI fallback |
| Launch new | `grok -p {prompt} --output-format streaming-json --session-id {uuid}` |
| Resume by ID | `grok -p {prompt} --output-format streaming-json --resume {sessionId}` |
| Session/parser | caller UUID; typed stream terminal event must be fixture-tested |
| Credits | provider dashboard fallback until a documented machine interface exists |
| Cancellation/recovery | ACP interrupt/server reconnect or signal+exact resume |
| Security / complexity / recommendation | sandbox+deny policy; medium; supported |

### App delta and proposed tests

Add `--output-format streaming-json`, replace `--always-approve` with policy and
sandbox profile, and evaluate `grok agent stdio`. Test new UUID versus resume,
fork IDs, final/error events, signals, server reconnect, prompt-file behavior and
model-independent parser fixtures.

## Unknowns and next verification

Verify authenticated stream schema, token/cost fields, account quota interface,
session durability and ACP protocol/version negotiation.

