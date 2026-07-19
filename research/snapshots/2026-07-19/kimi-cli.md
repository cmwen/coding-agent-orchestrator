# Kimi CLI

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date / tier | 2026-07-19 / watch |
| Version / test | official repository shows `1.49.0` released 2026-07-16; not installed |
| Source | [MoonshotAI repository](https://github.com/MoonshotAI/kimi-cli), Apache-2.0 |

## Executive finding and evidence

Kimi CLI supports ACP (`kimi acp`), MCP and an SDK, but the repository now says
it is evolving into Kimi Code CLI, automatically migrating configuration and
sessions while this project is gradually wound down. Treat this as an active
migration, not a stable new integration target.

## Normalized capability status

| Area | Result | Notes |
| --- | --- | --- |
| Install/source/platform/version | yes | open source; `1.49.0`; successor migration announced |
| Interactive/headless/prompt | partial | terminal agent; exact one-shot syntax not pinned |
| JSON/JSONL/final/session schema | unknown | ACP is preferred; CLI stream not established |
| Exact resume/fork/export/compaction | unknown | migration claims sessions transfer; exact commands unverified |
| Models/auth/BYOK/local | partial | Kimi login/config; details need current successor docs |
| Tokens/cost/account quota | unknown | not-tested |
| MCP/ACP/SDK | yes | `kimi acp`, MCP commands, `sdks/kimi-sdk` |
| Hooks/skills/agents/permissions | partial | repository contains agent/skill support; contract unpinned |
| Sandbox/Git/images/logs/recovery | unknown | not-tested |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best interface | ACP, after successor migration settles |
| Launch / resume | `kimi acp` protocol / exact resume unavailable this run |
| Parser / credits | ACP typed messages / unavailable |
| Cancellation/security | ACP cancel; isolated workspace and login boundary |
| Complexity / recommendation | high / watch |

### App delta, tests, and unknowns

Keep `kimi-cli` on watch and add a proposed inventory item/rename for Kimi Code
CLI once official successor docs expose its executable and protocol. Test config
and session migration, ACP initialize/cancel, exact restore and version boundary.

