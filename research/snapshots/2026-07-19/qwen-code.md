# Qwen Code

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time / tier | `2026-07-19T12:00:00+10:00` / candidate |
| Vendor / version | Alibaba Qwen / unknown: CLI absent; rolling repository reviewed |
| Install / auth | npm package; not-tested |
| Source | Open source, Apache-2.0; [shared environment](./METHODOLOGY.md) |

## Executive finding

Qwen Code is an active Gemini-derived terminal agent, but this run did not find
enough official, version-pinned evidence to assert a stable structured stream or
exact-ID resume contract. Keep it a candidate pending an isolated CLI probe.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | official source | [Repository](https://github.com/QwenLM/qwen-code) | Product, source, install and active development |

## Capability snapshot

| Area | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Install/source/platform/version | partial | E1 | npm/open source; exact release not obtained |
| Interactive/headless/prompt/stdin/file | partial | E1 | interactive agent advertised; exact syntax not pinned |
| JSON/JSONL/events/schema/final/session IDs | unknown | E1 | requires CLI help/source verification |
| Exit/signals/timeouts/server | unknown | E1 | not-tested |
| Latest/exact resume/list/fork/export/compaction | unknown | E1 | do not infer from Gemini ancestry |
| Models/reasoning/BYOK/local/auth | partial | E1 | Qwen and configurable providers advertised |
| Tokens/cost/account quota | unknown | E1 | not verified |
| Hooks/extensions/skills/agents/MCP/ACP/SDK | partial | E1 | repository advertises extensions/MCP; contracts not pinned |
| Permissions/sandbox/Git/images/logs | unknown | E1 | not-tested |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | unknown; prefer structured CLI/ACP if verified |
| Launch / resume | unavailable until exact help is recorded |
| Session/parser | no stable contract accepted this run |
| Credits | unavailable |
| Cancellation/recovery | process boundary only |
| Security / complexity / recommendation | disposable sandbox; high; watch |

### App delta and proposed tests

Do not clone Gemini assumptions. Install the exact npm release in a disposable
workspace; capture all help, JSON modes, session IDs, permissions, auth and
exit/signal behavior before adding a registry entry.

## Unknowns and next verification

All orchestration-critical surfaces remain unverified; this is reduced coverage,
not evidence of absence.

