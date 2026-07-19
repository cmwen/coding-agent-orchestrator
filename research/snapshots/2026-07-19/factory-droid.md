# Factory Droid

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time / tier | `2026-07-19T12:00:00+10:00` / candidate |
| Vendor / version | Factory / unknown current CLI; docs cite `v0.19.8` historically, CLI absent |
| Install / auth | official script; `FACTORY_API_KEY`; not-tested |
| Source | Closed CLI; published TypeScript/Python SDKs; [shared](./METHODOLOGY.md) |

## Executive finding

Droid has arguably the richest documented orchestrator surface: secure-by-
default one-shot JSON, exact-ID continuation, and bidirectional streaming
JSON-RPC with permissions, interrupts, token usage, fork, compaction and typed
SDKs. It is a high-priority candidate despite the missing local version probe.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | official docs | [Droid Exec](https://docs.factory.ai/cli/droid-exec/overview) | JSON result, session IDs, JSON-RPC, SDKs and secure defaults |
| E2 | official docs | [CLI reference](https://docs.factory.ai/reference/cli-reference) | command surface |
| E3 | official docs | [Hooks](https://docs.factory.ai/reference/hooks-reference) | lifecycle and compaction hooks |
| E4 | official docs | [Release notes](https://docs.factory.ai/changelog/release-notes) | stream JSON input and pre-created sessions |

## Capability snapshot

| Area | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Install/platform/version/source | partial | E1-E2 | official installer; exact release unknown; closed |
| Headless/arg/stdin/file/non-TTY | yes | E1 | `droid exec {prompt}`; pipe; `-f` |
| JSON / bidirectional JSON-RPC / IDs/final/errors | yes | E1 | `-o json`; `stream-jsonrpc`; typed notifications |
| Exit/signal/timeout/interrupt/reconnect | yes | E1 | process transport, interrupt methods, cleanup guidance |
| Caller ID / exact continuation / fork | yes | E1,E4 | `--session-id {id}`; JSON-RPC load/fork |
| List/export/compaction/upgrade | partial | E1,E3 | compact/history RPC; retention/upgrade not-tested |
| Models/reasoning/BYOK/auth | yes | E1 | model, effort, custom models, API key |
| Per-run tokens/cost | yes | E1 | session notifications include token usage |
| Account credits/quota | unknown | E1 | not documented as machine balance |
| Hooks/agents/MCP/SDK/server | yes | E1,E3 | TypeScript/Python SDK and raw protocol |
| Permissions/sandbox/Git/images/logs | yes | E1 | read-only default; autonomy tiers; typed permission requests |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | TypeScript SDK or raw streaming JSON-RPC |
| Launch / resume | initialize JSON-RPC new session / `droid.load_session {sessionId}` then add message |
| Session/parser | typed session notifications; correlate JSON-RPC IDs and turn completion |
| Credits | token notifications; dashboard/API fallback for balance |
| Cancellation/recovery | protocol interrupt, process reconnect and load exact session |
| Security / complexity / recommendation | read-only default and permission bridge; medium; candidate |

### App delta and proposed tests

Prioritize an SDK spike. Test protocol initialization/version, server-to-client
permission/ask-user requests, new/precreated/load/fork IDs, turn completion,
interrupt/reconnect, compaction, token usage and secret redaction.

## Unknowns and next verification

Pin an exact CLI/SDK pair and determine account quota, session retention,
cross-machine behavior, exit codes and schema compatibility guarantees.

