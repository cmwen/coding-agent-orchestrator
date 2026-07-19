# Cline CLI

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time / tier | `2026-07-19T12:00:00+10:00` / candidate |
| Vendor / version | Cline / unknown: CLI absent; current docs reviewed |
| Install / auth | official package/installer; not-tested |
| Source | Open source core; [shared environment](./METHODOLOGY.md) |

## Executive finding

Cline exposes JSON output, exact session-ID resume, timeout/retry controls, ACP,
hooks, plugins, MCP, schedules and a local hub daemon. It is a serious candidate,
but the default CLI auto-approves tools and the JSON final/session schema still
needs a pinned black-box probe.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | official docs | [CLI reference](https://docs.cline.bot/cli/cli-reference) | Full flags, JSON, ID resume, ACP, timeout, history/hub |
| E2 | official docs | [Hooks](https://docs.cline.bot/customization/hooks) | Runtime hooks including task resume |
| E3 | official docs | [Installation](https://docs.cline.bot/getting-started/installing-cline) | Install paths/platforms |

## Capability snapshot

| Area | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Install/platform/version/source | partial | E1,E3 | exact version unavailable locally |
| Interactive/headless/arg/cwd/non-TTY | yes | E1 | default prompt run; `-i` TUI; `-c {cwd}` |
| stdin/prompt file | unknown | E1 | system/config files exist; prompt input not verified |
| JSON/session/tool/final/error schema | partial | E1 | `--json`; exact event/final contract needs fixture |
| Timeout/retries/signals/server | partial | E1 | `--timeout`, `--retries`, hub; signals not-tested |
| Exact resume/list/history | yes | E1 | `--id {session-id}`; `history` |
| Latest/fork/export/compaction | unknown | E1 | not established |
| Models/reasoning/BYOK/auth | yes | E1 | provider/model/key/thinking controls |
| Per-run tokens/cost/quota | unknown | E1 | not established |
| Hooks/plugins/MCP/ACP/schedules/hub | yes | E1-E2 | unusually broad automation surface |
| Permissions/sandbox/Git/images/logs | partial | E1 | command policy and isolated data-dir; default auto-approve risk |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | ACP or JSON CLI; evaluate hub |
| Launch / resume | `cline --json --auto-approve false {prompt}` / add `--id {sessionId}` |
| Session/parser | JSON fixtures required; persist emitted/history ID |
| Credits | unavailable/provider-specific |
| Cancellation/recovery | timeout/signal; exact ID resume; hub reconnect unverified |
| Security / complexity / recommendation | isolated `--data-dir`, approvals false; medium; candidate |

### App delta and proposed tests

Install a pinned CLI in a disposable workspace. Test JSON framing/final events,
session capture/resume, timeout, retries, hook injection, ACP, hub restart,
provider auth, `--data-dir` isolation and `--auto-approve false` behavior.

## Unknowns and next verification

Determine exact current version, license/package, stdin/file prompts, fork,
compaction, token/cost fields, account quota and schema versioning.

