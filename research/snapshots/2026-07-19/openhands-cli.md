# OpenHands CLI

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time / tier | `2026-07-19T12:00:00+10:00` / candidate |
| Vendor / version | OpenHands / unknown: CLI absent; current docs reviewed |
| Install / auth | official binary/package; not-tested |
| Source | Open source; [shared environment](./METHODOLOGY.md) |

## Executive finding

OpenHands has a documented headless JSONL mode, but it always approves every
action and cannot use its LLM-approval mode headlessly. No exact-ID resume
contract was established. This is unsafe as a default local orchestrator backend
without a strong external sandbox.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | official docs | [CLI quick start](https://docs.openhands.dev/openhands/usage/cli/quick-start) | Install and interactive CLI |
| E2 | official docs | [Headless mode](https://docs.openhands.dev/openhands/usage/cli/headless) | `--headless`, task/file, JSONL and always-approve warning |
| E3 | official source | [CLI repository](https://github.com/OpenHands/OpenHands-CLI) | Source and releases |

## Capability snapshot

| Area | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Install/source/platform/version | partial | E1,E3 | exact version unavailable locally |
| Interactive/headless/arg/file/non-TTY | yes | E1-E2 | `openhands --headless -t {prompt}` or `-f {file}` |
| stdin | unknown | E2 | not documented |
| JSONL/tool events/final/schema/IDs | partial | E2 | action/observation JSONL; final/session fields not established |
| Exit/signal/timeout/recovery | unknown | E2 | not-tested |
| Sessions/resume/fork/export/compaction | unknown | E1-E3 | no exact contract established |
| Models/auth/BYOK/local | partial | E1-E3 | configurable LLMs; exact service auth not-tested |
| Usage/cost/quota | unknown | E1-E3 | not verified |
| Extensions/MCP/SDK/permissions | partial | E1-E3 | platform extensibility; headless always-approve is decisive risk |
| Sandbox/Git/images/logs | partial | E1-E3 | external/runtime isolation available; CLI binary probe needed |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | headless JSONL only inside disposable container |
| Launch / resume | `openhands --headless --json -t {prompt}` / unavailable |
| Session/parser | parse action/observation; terminal result unknown |
| Credits | unavailable/provider-specific |
| Cancellation/recovery | kill container/process; no resume claim |
| Security / complexity / recommendation | mandatory external sandbox; high; watch |

### App delta and proposed tests

Do not integrate into a real project without container/worktree isolation. Test
final events, exit codes, timeout, disabled network, prompt file, failure and
workspace diff from a harmless fixture.

## Unknowns and next verification

Pin/install the current binary and determine session IDs, resume, event schema,
usage and whether a safer headless permission mode has appeared.

