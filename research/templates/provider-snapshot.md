# <Product name>

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time | `<ISO-8601 with timezone>` |
| Researcher | `<agent/model or person>` |
| Tracking tier | `supported \| candidate \| watch` |
| Vendor | `<vendor>` |
| Product and CLI version | `<exact version, or unknown with reason>` |
| Release/package date | `<date>` |
| Install source | `<package/release URL and exact install command>` |
| Test environment | `<OS, architecture, runtime, TTY/non-TTY>` |
| Authentication tested | `<redacted mode, or not-tested>` |
| Source availability | `<open/closed/partial and license>` |

## Executive finding

Summarize the most important orchestration result, exact-ID session support,
structured-output support, and account usage/credits visibility in 3–6 sentences.

## Evidence log

| ID | Kind | Version/date | Source or redacted command | What it establishes |
| --- | --- | --- | --- | --- |
| `E1` | `official-docs \| official-source \| cli-output \| black-box-test` | `<version/date>` | `<URL or command>` | `<claim>` |

## Installation and identity

| Capability | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Install without GUI | `<normalized value>` | `<E#>` | |
| Deterministic version install | | | |
| Self-update command | | | |
| Version command | | | `<exact syntax>` |
| macOS / Linux / Windows | | | |
| Open-source implementation | | | `<repository/license>` |

## CLI and process contract

| Capability | Result | Evidence | Exact syntax / behavior |
| --- | --- | --- | --- |
| Interactive mode | | | |
| Headless/non-interactive mode | | | |
| Prompt argument | | | |
| Prompt from stdin | | | |
| Prompt from file | | | |
| Works without TTY | | | |
| Machine-stable exit codes | | | |
| Clean stdout/stderr separation | | | |
| SIGINT/SIGTERM cancellation | | | |
| Timeout or max-turn control | | | |
| Background/server/daemon mode | | | |

Record launch syntax, significant environment variables, process-tree behavior,
and observed behavior on interruption or crash.

## Structured output and events

| Capability | Result | Evidence | Exact syntax / schema notes |
| --- | --- | --- | --- |
| Single JSON result | | | |
| Streaming JSONL/NDJSON | | | |
| Versioned/published schema | | | |
| Session ID in output | | | |
| Stable event IDs | | | |
| Tool-call events | | | |
| Token/cost events | | | |
| Error event and final-result marker | | | |

Include a short, redacted output sample when permitted. State whether terminal
decoration, progress messages, or logs can corrupt the structured stream.

## Sessions, context, and memory

| Capability | Result | Evidence | Exact syntax / behavior |
| --- | --- | --- | --- |
| Creates canonical session ID | | | |
| Reports ID machine-readably | | | |
| List/show sessions | | | |
| Continue latest | | | |
| Resume exact caller-supplied ID | | | |
| Resume with a new prompt | | | |
| Fork/branch session | | | |
| Cross-directory resume | | | |
| Cross-machine/cloud resume | | | |
| Export/import transcript | | | |
| Automatic context compaction | | | |
| Manual compaction | | | |
| Documented expiry/retention | | | |
| Stable across CLI upgrades | | | |

Document where local session data lives without publishing private contents.
Explain whether resume preserves the original working directory, model,
permissions, instructions, and tool state. Never equate “continue latest” with
exact-ID resume.

## Models and authentication

| Capability | Result | Evidence | Exact syntax / behavior |
| --- | --- | --- | --- |
| List models machine-readably | | | |
| Select model per invocation | | | |
| Reasoning/effort control | | | |
| Automatic fallback/routing | | | |
| First-party subscription login | | | |
| API key / BYOK | | | |
| Local model support | | | |
| OpenAI-compatible endpoint | | | |
| Non-interactive/service auth | | | |

## Usage, tokens, credits, and limits

| Metric/interface | Result | Evidence | Source, freshness, and format |
| --- | --- | --- | --- |
| Per-run input/output tokens | | | |
| Cache/reasoning tokens | | | |
| Per-run estimated/actual cost | | | |
| Account credits/quota remaining | | | |
| Rate-limit windows and reset time | | | |
| Plan/subscription name | | | |
| Headless CLI/API access | | | |
| Interactive command | | | |
| Local usage file/database | | | |
| Official account dashboard | | | |

State the exact unit and denominator. Distinguish per-run statistics from the
remaining subscription allowance. Note whether calling an interface refreshes
live account state and whether its authentication is safe for a local service.

## Automation, control, and extensibility

| Capability | Result | Evidence | Exact syntax / behavior |
| --- | --- | --- | --- |
| Lifecycle hooks and schemas | | | |
| Plugins/extensions | | | |
| Project/user instructions | | | |
| Skills | | | |
| Custom agents/subagents | | | |
| MCP | | | |
| ACP | | | |
| SDK/API/local server | | | |
| Permissions/approval policy | | | |
| Sandbox/isolation | | | |
| Git/worktree integration | | | |
| Checkpoint/undo | | | |
| Concurrent/background agents | | | |
| Images/attachments/browser | | | |
| Logs/telemetry/observability | | | |

## Configuration and operational notes

Describe configuration scopes and precedence, relevant environment variables,
startup/performance observations, offline behavior, network/proxy requirements,
rate-limit and transient-error recovery, compatibility concerns, deprecations,
and experimental or undocumented features.

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | `direct-cli \| structured-cli \| local-server \| ACP \| SDK \| API` |
| Launch-new template | `<command with placeholders>` |
| Resume-by-ID template | `<command with {sessionId} and {prompt}, or unavailable>` |
| Session ID capture | `<event/field/command/regex and timing>` |
| Output parser | `<format, schema, final marker, stderr rules>` |
| Credits collector | `<command/API/file/dashboard/fallback>` |
| Cancellation/recovery | `<signals, reconnect, retry constraints>` |
| Security boundary | `<credentials, permissions, workspace isolation>` |
| Complexity | `low \| medium \| high` |
| Recommendation | `supported \| candidate \| watch \| do-not-integrate` |

### App delta and proposed tests

List concrete changes relative to `apps/runtime/src/cli-providers.ts`, session
launch/parsing, and the credits dashboard. Include fixtures or contract tests
needed before declaring support.

## Unknowns and next verification

List unresolved questions, why they remain unresolved, and the safest exact test
for the next run.
