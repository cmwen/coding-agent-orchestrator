# Anthropic Claude Code

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time / tier | `2026-07-19T12:00:00+10:00` / candidate |
| Vendor / version | Anthropic / unknown: CLI absent; rolling docs retrieved 2026-07-19 |
| Install / environment / auth | official installer/npm; [shared](./METHODOLOGY.md); not-tested |
| Source | Closed CLI; published Agent SDK |

## Executive finding

Claude Code is a first-class candidate with JSON/stream-JSON, exact-ID resume,
session IDs and usage in output, rich hooks, and TypeScript/Python Agent SDKs.
Use the SDK or structured print mode, never terminal screen scraping.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | official docs | [Headless/Agent SDK](https://code.claude.com/docs/en/headless) | `-p`, JSON/NDJSON, session resume, usage and retry events |
| E2 | official docs | [Hooks reference](https://code.claude.com/docs/en/hooks) | Typed lifecycle JSON and session IDs |
| E3 | official docs | [Overview](https://code.claude.com/docs/en/overview) | Install, auth and supported workflows |

## Capability snapshot

| Area | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Install/platform/version/source | partial | E3 | closed CLI; exact version unavailable locally |
| Interactive/headless/arg/stdin/file/non-TTY | yes | E1 | `claude`; `claude -p {prompt}`; pipes supported |
| JSON/stream/schema/final/session/usage/error | yes | E1-E2 | `--output-format json|stream-json`; terminal result and `system/api_retry` |
| Exit/signal/timeout/restart | partial | E1 | SDK cancellation/timeouts; exact CLI matrix not-tested |
| Continue latest / exact resume with prompt | yes | E1 | `--continue`; `claude -p {prompt} --resume {sessionId}` |
| Fork/list/export/cross-machine/expiry | partial | E1-E3 | SDK/session tooling; exact retention not verified |
| Compaction/upgrade | yes | E2 | PreCompact/SessionStart compact events; durability not-tested |
| Models/reasoning/subscription/API/service auth | yes | E1-E3 | model flags, login/API key/SDK |
| Per-run tokens/cost | yes | E1 | JSON result metadata |
| Account quota remaining | interactive-only | E3 | `/usage`/account UI; no documented headless collector established |
| Hooks/plugins/skills/agents/MCP/SDK | yes | E1-E3 | mature extension and SDK surfaces |
| Permissions/sandbox/git/worktrees/images/browser/logs | yes | E1-E3 | documented modes and tools; authenticated behavior not-tested |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | Agent SDK; stream-JSON CLI fallback |
| Launch / resume | `claude -p {prompt} --output-format stream-json --verbose` / add `--resume {sessionId}` |
| Session/parser | capture `session_id`; terminal result, retry and error events |
| Credits | per-run usage; interactive/account fallback for remaining quota |
| Cancellation/recovery | SDK abort; persist ID; exact resume after process ends |
| Security / complexity / recommendation | explicit permission mode and sandbox; medium; candidate |

### App delta and proposed tests

Add an SDK adapter, stream fixtures, hook-based session capture fallback and
permission mapping. Test new/resume output equivalence, retry events, hook
blocking, compaction, SIGINT and subscription versus API-key auth boundaries.

## Unknowns and next verification

Pin an exact installed release in a disposable workspace; verify version, exit
codes, session listing/fork/expiry and whether any machine-readable account quota exists.

