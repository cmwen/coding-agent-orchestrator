# Mistral Vibe

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date / tier | 2026-07-19 / watch |
| Version / test | unknown current release; CLI absent, not-tested |
| Source | [Official repository](https://github.com/mistralai/mistral-vibe), open source |

## Executive finding and evidence

The official repository documents headless prompt mode, aggregate JSON or
streaming NDJSON, exact session-ID resume, max turns/price/tokens, skills,
subagents and MCP. This is now candidate-quality on paper, with the important
risk that programmatic mode defaults to auto-approve.

## Normalized capability status

| Area | Result | Notes |
| --- | --- | --- |
| Install/source/platform/version | partial | uv/pip/installer; UNIX target; exact release absent |
| Interactive/headless/arg/workdir | yes | `vibe --prompt {prompt}`; `--workdir` |
| JSON/NDJSON/events/final IDs | partial | `--output json|streaming`; schema not pinned |
| Exit/signal/restart | partial | budget stops documented; signals not-tested |
| Latest/exact resume | yes | `--continue`; `--resume {sessionId}` with logging enabled |
| List/fork/export/compaction/upgrades | unknown | not established |
| Models/API key | yes | Mistral key and configurable agents/models |
| Per-run tokens/cost budget | yes | `--max-price`, `--max-tokens` |
| Account quota | unknown | no machine balance verified |
| Skills/agents/MCP/permissions | yes | extensible; programmatic auto-approve risk |
| Sandbox/Git/images/logs | partial | trust/workdir/log controls; sandbox unknown |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best interface | streaming CLI |
| Launch / resume | `vibe --prompt {prompt} --output streaming --agent plan` / add `--resume {sessionId}` |
| Parser / credits | pin NDJSON terminal/session schema; per-run budget only |
| Cancellation/security | budget+signal; explicit agent/tool allowlist; isolate cwd |
| Complexity / recommendation | medium / candidate (proposed promotion) |

### App delta, tests, and unknowns

Propose watch→candidate. Pin/install a release; test session logging dependency,
stream final/error IDs, budget exits, explicit non-auto agent, tool allowlist,
SIGINT, resume, API-key redaction and upgrade durability.

