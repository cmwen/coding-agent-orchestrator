# Google Gemini CLI

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time | `2026-07-19T12:00:00+10:00` |
| Researcher / tier | OpenAI Codex / supported |
| Vendor / version | Google / `0.46.0` installed |
| Install / environment | npm package; [shared environment](./METHODOLOGY.md) |
| Authentication | not-tested; consumer sign-in migration is material |
| Source | Open source, Apache-2.0 |

## Executive finding

Gemini CLI still provides headless JSON/stream-JSON and exact UUID resume, but
Google moved consumer Pro/Ultra/free traffic to Antigravity on 2026-06-18.
Enterprise/Standard and API-key paths remain relevant. Treat it as a legacy or
specialized backend until the supported account matrix is tested.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | CLI output | `gemini --version`; `gemini --help` | Version, session IDs, stream JSON, ACP, policy/worktree flags |
| E2 | official source | [Configuration reference](https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/configuration.md) | Headless formats and exact resume syntax |
| E3 | official source | [Commands/session management](https://github.com/google-gemini/gemini-cli/blob/main/docs/reference/commands.md) | Project-scoped history, export, checkpoints |
| E4 | official source | [Releases](https://github.com/google-gemini/gemini-cli/releases) | Active releases and resume fixes |
| E5 | official Google | [Gemini/Antigravity choice](https://cloud.google.com/blog/topics/developers-practitioners/choosing-antigravity-or-gemini-cli) | Product/account migration |

## Installation, CLI, and structured output

| Capability | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Install/version/cross-platform/open source | yes | E1-E4 | `gemini --version`; npm; Apache-2.0 |
| Interactive / headless / arg / stdin | yes | E1-E2 | `gemini`; `gemini -p {prompt}`; stdin appended |
| Prompt file | partial | E1 | shell redirection or `--session-file`; no dedicated prompt-file flag |
| JSON / stream JSON / session field | yes | E1-E2 | `-o json`; `-o stream-json` |
| Exit/stdout/signals/timeouts | unknown | E1-E2 | no stable matrix verified |

## Sessions, models, auth, and economics

| Capability | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Caller-chosen ID / exact resume | yes | E1-E2 | `--session-id {uuid}`; `--resume {uuid}` |
| Continue/list/delete/export | yes | E1-E3 | `--resume latest`; `--list-sessions`; `--delete-session`; `/chat share` |
| Fork/cross-directory/cross-machine | partial | E3 | project-scoped; JSON session file supports transfer; fork unknown |
| Compaction/checkpoint/upgrade | partial | E3-E4 | restore/rewind documented; upgrade behavior not-tested |
| Model/reasoning/BYOK/local/auth | partial | E1-E2,E5 | `--model`; API key/Google login; `gemma`; consumer route changed |
| Per-run tokens/cost | partial | E2 | structured result usage documented in source; not observed |
| Account quota remaining machine interface | unknown | E5 | quotas documented; no headless balance command verified |

## Automation, workspace, and operations

| Capability | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Hooks/extensions/skills/instructions | yes | E1-E3 | built-in subcommands and project settings |
| MCP / ACP / policy / sandbox | yes | E1 | ACP, MCP allowlist, policy engine, sandbox/worktree |
| Git/checkpoints/images/browser/logs | partial | E1-E3 | worktree and restore yes; remaining features not-tested |
| Offline/recovery/deprecations | partial | E4-E5 | active fixes; consumer migration is a product risk |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | structured CLI; evaluate ACP |
| Launch new | `gemini -p {prompt} -o stream-json --session-id {uuid} --approval-mode plan` |
| Resume by ID | `gemini -p {prompt} -o stream-json --resume {sessionId}` |
| Session/parser | caller UUID; NDJSON with explicit init/result/error fixtures |
| Credits | account dashboard/quota docs fallback; no live collector claim |
| Cancellation/recovery | signal process, retain project+UUID; resume exact UUID after exit |
| Security / complexity / recommendation | policy+sandbox; medium; candidate for enterprise/API-key users |

### App delta and proposed tests

The runtime omits `-o stream-json`, invokes unrestricted `yolo`, and presents
Gemini as generally supported. Add account-mode gating, structured output on
new/resume, and tests for UUID/project scoping, consumer migration errors,
session-file import, SIGINT, and policy-denied tools.

## Unknowns and next verification

Test Standard/Enterprise/API-key authentication separately and verify final
event schema, token accounting, quota visibility and compatibility of `0.46.0`
sessions after upgrades.

