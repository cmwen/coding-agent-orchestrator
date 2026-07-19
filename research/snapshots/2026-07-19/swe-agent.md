# SWE-agent

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date / tier | 2026-07-19 / watch |
| Version / test | unknown current release; not installed, not-tested |
| Source | [Official repository](https://github.com/SWE-agent/SWE-agent), open source |

## Executive finding and evidence

SWE-agent is optimized for reproducible issue-solving experiments. Official
[trajectory documentation](https://github.com/SWE-agent/SWE-agent/blob/main/docs/usage/trajectories.md)
describes JSON `.traj`, configuration, logs, predictions and replayable runs.
Those artifacts are useful batch evidence but are not a verified live event
protocol or caller-supplied conversation resume interface.

## Normalized capability status

| Area | Result | Notes |
| --- | --- | --- |
| Install/source/platform/headless | yes | Python batch runner; exact version not pinned |
| Prompt/file/stdin/non-TTY | partial | issue/config-driven workflows |
| Structured artifacts | yes | JSON trajectory after/during experiment |
| Live JSON stream/schema/final IDs | unknown | not established |
| Exact session resume/fork/compaction | unknown | rerun config is not conversation resume |
| Models/BYOK/local/auth | partial | configurable model backends |
| Per-run usage/cost | partial | trajectory/config may record model economics; not verified |
| Account quota | not-applicable | upstream-specific |
| Hooks/MCP/ACP/SDK/permissions | unknown | not tested for orchestrator use |
| Git/container/logs/recovery | yes | strong experiment/container artifact model |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best interface | batch CLI/artifact ingestion |
| Launch / resume | `sweagent run --config {config}` / unavailable by chat ID |
| Parser / credits | parse `.traj`/status after run / provider-specific |
| Cancellation/security | terminate container; disposable checkout |
| Complexity / recommendation | high / watch |

### App delta, tests, and unknowns

No chat-provider registry change. Consider a separate batch-job adapter only if
benchmark/issue automation becomes a product goal. Test partial trajectory
writes, crash status, exit codes and reproducibility before integration.

