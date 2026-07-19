# GitHub Copilot CLI

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time | `2026-07-19T12:00:00+10:00` |
| Researcher / tier | OpenAI Codex / supported |
| Vendor / version | GitHub / CLI `1.0.63` (installed) |
| Install / update | npm or official installer; `copilot update` |
| Environment / auth | [shared environment](./METHODOLOGY.md); existing login not exercised |
| Source | Closed product; published CLI, SDK and protocol documentation |

## Executive finding

Copilot has an excellent automation surface: prompt mode, JSONL, caller-chosen
session UUIDs, exact-ID resume, ACP, and a JSON-RPC SDK. It also exposes rich
hooks and a live account quota RPC. The SDK/RPC surface is a better long-term
orchestrator boundary than terminal transcript scraping.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | CLI output | `copilot --version`; `copilot --help` on 2026-07-19 | Version, JSONL, session, model, permissions, ACP flags |
| E2 | official docs | [CLI command reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference) | `-p`, JSONL, continue/resume semantics |
| E3 | official docs | [Programmatic reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference) | Headless use and model selection |
| E4 | official docs | [Hooks](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/use-hooks) | Versioned hook file and lifecycle events |
| E5 | official docs | [SDK compatibility](https://docs.github.com/en/copilot/how-tos/copilot-sdk/troubleshooting/compatibility) | JSON-RPC SDK create/resume/delete session |

## Installation, CLI, and structured output

| Capability | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Install/version/update; macOS/Linux/Windows | yes | E1-E3 | `copilot --version`; `copilot update` |
| Interactive / non-TTY headless / prompt arg | yes | E1-E3 | `copilot`; `copilot -p {prompt}` |
| stdin / prompt file | partial | E1 | attachment/share exist; direct stdin/file prompt not verified |
| JSONL stream / terminal result | yes | E1-E2 | `--output-format json`; final event must be schema-tested |
| Exit codes / stdout-stderr / signals | partial | E2 | scripting documented; exact signal matrix not-tested |
| Timeout / daemon | partial | E1,E5 | max autopilot turns; SDK subprocess/JSON-RPC |

## Sessions, models, auth, and economics

| Capability | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Canonical caller ID / machine output | yes | E1-E2 | `--session-id {uuid}`; JSONL carries session context |
| Continue latest / resume exact ID | yes | E1-E2 | `--continue`; `--resume={id}` or `--session-id={id}` |
| List/show/delete/export/fork/cross-machine | partial | E1,E5 | SDK delete; `--share`; remote sessions; fork unknown |
| Context compaction / upgrade retention | partial | E2 | long-context tier documented; compatibility not-tested |
| Model selection / reasoning / auth | yes | E1-E3 | `--model`; `--reasoning-effort`; GitHub login/token SDK |
| BYOK / local / OpenAI-compatible | partial | E1 | custom providers documented in help; not-tested |
| Per-run tokens/cost | yes | E2 | prompt-mode usage statistics unless `--silent` |
| Account quota/plan/reset machine interface | yes | local app code | SDK RPC `account.getQuota`; observed auth not-tested |

## Automation, workspace, and operations

| Capability | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Hooks/plugins/skills/instructions/custom agents | yes | E1,E4 | Project/user scopes; JSON hooks |
| MCP / ACP / SDK | yes | E1,E5 | ACP flag and JSON-RPC SDK |
| Permissions/sandbox/secrets | partial | E1 | granular allow/deny and secret redaction; no OS sandbox claim |
| Git/worktrees/checkpoints/images/browser | partial | E1 | attachments and tools yes; worktrees/checkpoints unknown |
| Logs/telemetry/recovery | yes | E1,E5 | log controls, OTel help, SDK reconnect boundary |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | SDK (JSON-RPC), with structured CLI fallback |
| Launch new | `copilot -p {prompt} --output-format json --session-id {uuid}` |
| Resume by ID | `copilot -p {prompt} --output-format json --resume={sessionId}` |
| Session capture / parser | caller UUID plus JSONL; ignore additive fields, require terminal result/error |
| Credits collector | existing `account.getQuota`, 60-second cache; keep auth in CLI process |
| Cancellation/recovery | terminate SDK/CLI turn, retain canonical ID, resume only after process exit |
| Security / complexity / recommendation | granular policy and isolated cwd; medium; supported |

### App delta and proposed tests

Stop using `--yolo` by default; express an explicit allow/deny policy. Add JSONL
on both new and resume runs, schema fixtures for terminal/error events, and SDK
evaluation. Test that `--session-id` does not accidentally resume a preexisting
UUID and that quota RPC failures never expose auth payloads.

## Unknowns and next verification

Authenticated black-box tests should verify exit codes, SIGINT recovery, JSONL
final markers, per-run token fields and SDK session durability across upgrades.

