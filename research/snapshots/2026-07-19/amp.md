# Amp

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time / tier | `2026-07-19T12:00:00+10:00` / candidate |
| Vendor / version | Sourcegraph/Amp team / rolling CLI unknown; SDK docs show `0.1.0-20260528044221-ge0e19fa` example |
| Install / auth | official CLI/SDK; not-tested |
| Source | Closed service/CLI with published SDK; [shared environment](./METHODOLOGY.md) |

## Executive finding

Amp provides streaming JSON, thread IDs, exact thread continuation, multi-turn
JSON input, cancellation, permissions plugins and a TypeScript SDK. The SDK is
the natural integration surface. Product documentation explicitly disclaims
backward compatibility, raising version-pinning and fixture requirements.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | official docs | [Manual](https://ampcode.com/manual) | execute stream JSON, threads, modes and no-backcompat posture |
| E2 | official docs | [SDK](https://ampcode.com/manual/sdk) | structured streams, exact thread continuation, config |
| E3 | official docs | [TypeScript SDK](https://ampcode.com/manual/sdk/typescript) | new thread IDs, cancel, permissions and options |
| E4 | official docs | [Appendix](https://ampcode.com/manual/appendix) | stream JSON compatibility/schema location |

## Capability snapshot

| Area | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Install/platform/version/source | partial | E1-E3 | exact CLI version unavailable; closed/rolling |
| Interactive/headless/arg/stdin/JSON input | yes | E1 | `amp --execute {prompt} --stream-json`; piped and JSON input |
| JSONL/schema/session/tool/final/error | yes | E1-E4 | Claude-compatible stream plus optional thinking extension |
| Exit/signal/timeout/cancel | yes | E3 | SDK wait timeout and `cancel()` |
| Latest/exact thread continuation | yes | E1-E3 | `amp threads continue`; SDK `continue: string|true` |
| Create ID/export/cross-machine | yes | E1-E3 | `threads.new()` and hosted thread URLs/markdown |
| Fork/compaction/upgrade | partial | E1 | hosted threads; no-backcompat risk |
| Models/reasoning/auth/BYOK/local | partial | E1-E3 | modes/multi-model service; BYOK/local unknown |
| Per-run cost/account credits | partial | E1 | pricing/usage surfaces; machine balance not established |
| Plugins/skills/agents/MCP/SDK | yes | E1-E3 | rich programmatic extension |
| Permissions/Git/images/logs/recovery | yes | E1-E3 | permission rules, images, logs, remote control |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | TypeScript SDK |
| Launch / resume | SDK `execute({prompt})` / `execute({prompt, options:{continue: sessionId}})` |
| Session/parser | `threads.new()` ID; async typed stream and terminal result |
| Credits | SDK per-run data; dashboard fallback for account balance |
| Cancellation/recovery | SDK cancel; hosted thread exact continuation |
| Security / complexity / recommendation | permissions plugin, private threads; medium; candidate |

### App delta and proposed tests

Prototype SDK behind a version lock. Test thread privacy, exact continuation,
cancel, no-archive option, stream schema drift, thinking extension, stdin close,
MCP isolation and account/auth failure.

## Unknowns and next verification

Pin current CLI/SDK compatibility, exact session listing/deletion, token/cost
fields, account quota API, exit codes and offline behavior.

