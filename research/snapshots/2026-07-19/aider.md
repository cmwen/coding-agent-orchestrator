# Aider

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time / tier | `2026-07-19T12:00:00+10:00` / candidate |
| Vendor / version | Aider project / unknown: CLI not installed and docs do not pin current package version |
| Install / environment / auth | `pipx install aider-chat`; [shared](./METHODOLOGY.md); not-tested |
| Source | Open source, Apache-2.0 |

## Executive finding

Aider remains strong for git-centric editing and broad model support, but its
documented scripting surface is text-oriented and lacks a verified stable event
protocol or exact canonical session-ID resume. It is better treated as a
one-shot candidate than a durable conversation backend.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | official docs | [Usage](https://aider.chat/docs/usage.html) | Interactive CLI and file editing |
| E2 | official docs | [Scripting](https://aider.chat/docs/scripting.html) | `--message` one-shot and environment options |
| E3 | official docs | [Commands](https://aider.chat/docs/usage/commands.html) | save, undo, reasoning and token controls |
| E4 | official source | [Repository](https://github.com/Aider-AI/aider) | Source/license/releases |

## Capability snapshot

| Area | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Install/source/platform/version/update | partial | E1,E4 | pipx; current exact version not obtained |
| Interactive/headless/prompt/file/stdin | yes | E1-E2 | `aider`; `aider --message {prompt}`; file arguments |
| JSON/JSONL/schema/session/error events | unknown | E2 | no stable structured agent stream verified |
| Exit/signal/timeout/restart | unknown | E1-E2 | not-tested |
| Canonical IDs/latest/exact resume/fork | unknown | E1-E3 | chat history/save exists; no exact-ID CLI contract verified |
| Export/checkpoint/undo/compaction | partial | E3 | `/save`, `/undo`; context behavior model-dependent |
| Models/reasoning/BYOK/local | yes | E1-E3 | many providers, model metadata and effort controls |
| Tokens/cost/account quota | partial | E3 | per-run usage/cost display; upstream balance unavailable |
| Hooks/plugins/skills/MCP/SDK | partial | E1-E4 | scripting and conventions; no preferred stable server protocol found |
| Permissions/sandbox/git/images/logs | partial | E1-E3 | strong Git/undo; external sandbox and approvals needed |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | direct one-shot CLI |
| Launch / resume | `aider --message {prompt} {files}` / unavailable by canonical ID |
| Session/parser | plain text; do not infer durable IDs |
| Credits | parse only explicit per-run summary; upstream dashboards for balance |
| Cancellation/recovery | signal process; restart as new one-shot |
| Security / complexity / recommendation | external sandbox; medium; watch |

### App delta and proposed tests

Do not set `supportsProviderSessionResume`. Before adding, test non-TTY exits,
stdout/stderr, git dirty-tree behavior, prompt-file handling and machine-readable
usage. Prefer a future published protocol over terminal scraping.

## Unknowns and next verification

Install the then-current pipx release in a disposable container and inspect all
help, version, message-file, exit-code and session/history options.

