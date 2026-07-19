# Goose

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time / tier | `2026-07-19T12:00:00+10:00` / candidate |
| Vendor / version | Agentic AI Foundation / latest official page shows `v1.36.0` (2026-05-27); not installed |
| Install / auth | official release script; not-tested |
| Source | Open source, Apache-2.0; [shared environment](./METHODOLOGY.md) |

## Executive finding

Goose is a flexible multi-provider open agent with MCP and growing ACP support.
Its provider/session CLI is useful, but this run did not establish a stable
event schema or exact resume/final-result contract comparable to Pi or Factory.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | official source | [Repository](https://github.com/aaif-goose/goose) | Version, install, license, providers, API claim |
| E2 | official source | [Provider documentation](https://github.com/aaif-goose/goose/blob/main/documentation/docs/getting-started/providers.md) | Provider configuration, ACP providers and session start |

## Capability snapshot

| Area | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Install/version/source/platform/update | yes | E1 | release script; Rust; desktop/CLI platforms |
| Interactive/headless/prompt/stdin/file | partial | E1-E2 | CLI sessions/recipes exist; exact one-shot syntax not recorded |
| JSON/stream/schema/session/final/error | unknown | E1-E2 | API advertised, protocol contract not pinned |
| Exit/signal/timeout/reconnect | unknown | E1-E2 | not-tested |
| Sessions/latest/exact/fork/export | partial | E2 | named session start; exact resume syntax not established |
| Models/BYOK/local/OpenAI-compatible/auth | yes | E1-E2 | 15+ providers, custom base URLs, keychain/env |
| Usage/cost/account quota | unknown | E1-E2 | provider-dependent |
| Extensions/MCP/ACP/API | yes | E1-E2 | 70+ MCP extensions and ACP providers |
| Permissions/sandbox/Git/images/logs | partial | E1-E2 | configurable; details require help/probe |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | ACP/API if its current contract is published; CLI fallback |
| Launch / resume | launch `goose session start ...`; exact resume unavailable this run |
| Session/parser | do not parse TUI; require ACP/API typed IDs and terminal events |
| Credits | provider-specific collectors only |
| Cancellation/recovery | ACP/process cancellation; persistence not verified |
| Security / complexity / recommendation | isolate provider keys and extensions; high; candidate |

### App delta and proposed tests

Prototype ACP against a pinned release; test initialize, prompt, permission,
cancel, exact session restore, provider failures and MCP isolation. Do not add
resume capability until caller-supplied ID syntax is demonstrated.

## Unknowns and next verification

Record full CLI help and current API/ACP protocol, session store, structured
events, compaction, usage telemetry and crash recovery in a disposable install.

