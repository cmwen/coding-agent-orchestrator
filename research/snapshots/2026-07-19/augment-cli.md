# Augment Code Auggie CLI

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date / tier | 2026-07-19 / watch |
| Version / test | unknown current release; CLI absent, not-tested |
| Source | Closed CLI; official docs retrieved 2026-07-19 |

## Executive finding and evidence

Auggie now merits promotion consideration: official
[CLI reference](https://docs.augmentcode.com/cli/reference) documents print
mode, JSON output, exact-ID resume, JSON session listing, credit summaries,
account status, MCP and ACP modes. Official
[hooks docs](https://docs.augmentcode.com/cli/hooks) expose lifecycle JSON with
conversation IDs.

## Normalized capability status

| Area | Result | Notes |
| --- | --- | --- |
| Install/platform/version/source | partial | closed; exact version unavailable |
| Interactive/headless/arg/non-TTY | yes | `auggie --print {prompt}` |
| JSON output/session IDs/final schema | partial | `--output-format json`; schema not fixture-tested |
| Exact resume/list/latest/delete/share | yes | `--resume {id}`; `session list --json`; `--continue` |
| Fork/export/compaction | unknown | share exists; remaining lifecycle unverified |
| Models/auth/BYOK/local | partial | account login/session JSON; model controls need probe |
| Per-run credits | yes | `--show-credits` |
| Account balance | partial | `auggie account status`; machine format not established |
| Hooks/plugins/MCP/ACP/permissions | yes | rich official surface |
| Sandbox/Git/logs/recovery | partial | permissions and diagnostic logs; sandbox unknown |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best interface | ACP or JSON CLI |
| Launch / resume | `auggie --print --output-format json {prompt}` / add `--resume {sessionId}` |
| Parser / credits | pin JSON schema; `--show-credits` plus account-status probe |
| Cancellation/security | signal; never print auth JSON; isolated workspace |
| Complexity / recommendation | medium / candidate (proposed promotion) |

### App delta, tests, and unknowns

Propose moving `augment-cli` from watch to candidate. Pin a release and test
JSON terminal/error events, session list/resume, ACP cancellation, credit units,
account-status freshness, permission denial, hook IDs and auth redaction.

