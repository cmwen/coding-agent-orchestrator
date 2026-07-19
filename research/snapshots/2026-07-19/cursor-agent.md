# Cursor Agent CLI

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time / tier | `2026-07-19T12:00:00+10:00` / candidate |
| Vendor / version | Cursor / unknown: beta CLI absent and docs do not pin a release |
| Install / auth | official install script; not-tested |
| Source | Closed source; [shared environment](./METHODOLOGY.md) |

## Executive finding

Cursor exposes one of the cleanest CLI contracts: single JSON or NDJSON,
documented terminal result/error semantics, session ID in initialization and
result events, exact-ID resume, and API-key auth. It is an attractive structured
CLI candidate, though still labeled beta and full-write print mode needs isolation.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | official docs | [Overview](https://docs.cursor.com/en/cli/overview) | Install, beta status, headless and sessions |
| E2 | official docs | [Parameters](https://docs.cursor.com/en/cli/reference/parameters) | Exact flags/model/API-key/resume |
| E3 | official docs | [Output format](https://docs.cursor.com/en/cli/reference/output-format) | JSON/NDJSON schema and terminal/error behavior |
| E4 | official docs | [Using CLI](https://docs.cursor.com/en/cli/using) | rules, permissions and history |

## Capability snapshot

| Area | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Install/platform/version/source | partial | E1-E2 | official script; beta; exact version unknown |
| Interactive/headless/arg/stdin/non-TTY | yes | E1-E3 | `cursor-agent`; `-p`; print inferred for pipes/non-TTY |
| Prompt file | unknown | E2 | no dedicated flag verified |
| JSON/NDJSON/schema/session/tool/final/error | yes | E3 | `--output-format json|stream-json`; result event and nonzero failure |
| Exit/stdout/signals/timeouts/server | partial | E3 | failure contract documented; cancellation/server unknown |
| Latest/list/exact resume | yes | E1-E4 | `cursor-agent resume`; `ls`; `--resume={chatId}` |
| Fork/export/cross-machine/compaction | partial | E4 | `/compress`; other lifecycle details unknown |
| Models/subscription/API key | yes | E1-E2 | `--model`; login or `CURSOR_API_KEY` |
| BYOK/local/reasoning | unknown | E1-E2 | not established |
| Per-run usage/account balance | unknown | E3 | duration but token/cost/quota fields not established |
| Rules/permissions/images/Git/logs | partial | E1-E4 | AGENTS/CLAUDE rules, approvals; print mode has write/bash |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | structured CLI |
| Launch / resume | `cursor-agent -p {prompt} --output-format stream-json` / add `--resume={sessionId}` |
| Session/parser | init/result `session_id`; correlate tool call IDs; require result or nonzero stderr |
| Credits | unavailable; account dashboard fallback |
| Cancellation/recovery | signal, then exact resume only after confirming process exit |
| Security / complexity / recommendation | isolated workspace; low-medium; candidate |

### App delta and proposed tests

Add a version-gated adapter and NDJSON fixtures. Test failure-without-JSON,
unknown additive fields, non-TTY inference, full-write print permissions, resume
cwd, SIGINT and API-key redaction.

## Unknowns and next verification

Pin an exact beta build and verify session list format, signals, token usage,
retention, fork/export and any permission-policy flags beyond `--force`.

