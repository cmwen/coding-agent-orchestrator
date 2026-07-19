# Kiro CLI

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time / tier | `2026-07-19T12:00:00+10:00` / candidate |
| Vendor / version | AWS / unknown: CLI absent; V2 and V3 docs reviewed |
| Install / auth | official script; browser or API-key mode; not-tested |
| Source | Closed product; [shared environment](./METHODOLOGY.md) |

## Executive finding

Kiro supports exact-ID resume, exported JSON sessions, hooks carrying UUIDs,
headless API-key automation and interactive usage credits. However, CLI 3.0 is
early access with a session format incompatible with V2 and no V3→V2 resume.
Version/engine gating is mandatory.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | official docs | [Get started](https://kiro.dev/docs/cli/) | Install/platform/headless positioning |
| E2 | official docs | [Chat sessions](https://kiro.dev/docs/cli/chat/) | exact resume, picker, JSON save/load |
| E3 | official docs | [Hooks](https://kiro.dev/docs/cli/hooks/) | typed JSON lifecycle hooks and session UUID |
| E4 | official docs | [CLI 3.0 early access](https://kiro.dev/docs/cli/v3/) | breaking session/permission/hook changes |
| E5 | official docs | [Slash commands](https://kiro.dev/docs/cli/reference/slash-commands/) | session ID and interactive `/usage` |

## Capability snapshot

| Area | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Install/platform/version/source | partial | E1 | closed CLI; exact version absent |
| Interactive/headless/prompt/non-TTY | yes | E1 | headless API-key automation advertised; exact flags need capture |
| JSON/stream/schema/final events | partial | E3 | hooks are JSON; headless output schema not established |
| Exit/signal/timeout/server | unknown | E1-E4 | not-tested |
| Canonical ID/latest/exact resume | yes | E2,E5 | `/session-id`; `chat --resume`; `chat --resume-id {id}` |
| Export/import/cross-machine | yes | E2 | `/chat save` and `/chat load` JSON |
| Fork/compaction/upgrade | partial | E4 | V3/V2 session incompatibility; fork unknown |
| Models/subscription/API-key/service auth | yes | E1,E5 | model command; browser/API key |
| Per-run tokens/cost | unknown | E5 | not established |
| Account credits/quota | interactive-only | E5 | `/usage` |
| Hooks/agents/MCP/permissions | yes | E1,E3-E4 | strong surfaces, version-specific schemas |
| Sandbox/Git/images/logs | partial | E1-E4 | permissions.yaml V3; details need binary probe |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | direct headless CLI once schema is pinned |
| Launch / resume | launch syntax not pinned / `kiro-cli chat --resume-id {sessionId}` |
| Session/parser | capture hook/session-id; parser must branch V2 vs V3 |
| Credits | `/usage` interactive fallback only |
| Cancellation/recovery | process signal; refuse cross-engine resume |
| Security / complexity / recommendation | permissions.yaml and isolated cwd; high; candidate |

### App delta and proposed tests

Version-gate engines, persist engine with session ID, and reject V2/V3 mismatch.
Test headless schema, hooks, permissions, save/load, exact resume, API-key auth,
SIGINT and migration diagnostics before registry support.

## Unknowns and next verification

Install a pinned V2/current and `--v3` build in disposable workspaces; record
headless flags, IDs, final events, usage and session migration behavior.

