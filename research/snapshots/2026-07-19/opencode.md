# OpenCode

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time | `2026-07-19T12:00:00+10:00` |
| Researcher / tier | OpenAI Codex / supported |
| Vendor / version | Anomaly / OpenCode `1.15.13` installed |
| Install / environment | Homebrew binary; [shared environment](./METHODOLOGY.md) |
| Authentication | not-tested |
| Source | Open source; license should be rechecked per release |

## Executive finding

OpenCode offers JSON events, exact session resume/fork, ACP, and a headless local
server. Its session list/export/import and multi-provider economics are useful.
The app drops JSON format on resume, and its credits card is correctly local
cost history rather than universal upstream subscription balance.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | CLI output | `opencode --version`; `opencode --help`; `opencode run --help`; session helps | Version, JSON events, server, exact resume/fork, session JSON list |
| E2 | official docs | [CLI reference](https://opencode.ai/docs/cli/) | Commands, stats, export/import and server behavior |
| E3 | official source | [Repository](https://github.com/anomalyco/opencode) | Source and releases |

## Installation, CLI, and structured output

| Capability | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Install/version/update/cross-platform/source | yes | E1-E3 | `opencode --version`; `opencode upgrade` |
| Interactive / headless / prompt arg | yes | E1-E2 | `opencode`; `opencode run {message}` |
| stdin / prompt file | unknown | E1-E2 | `--file` attaches files; prompt stdin not verified |
| JSON event stream / session IDs | yes | E1-E2 | `opencode run --format json` |
| Exit/stdout/signals/timeouts | unknown | E1-E2 | not black-box tested |
| Server/attach/ACP | yes | E1 | `opencode serve`; `run --attach`; `opencode acp` |

## Sessions, models, auth, and economics

| Capability | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Exact resume / latest / fork | yes | E1 | `run --session {id}`; `--continue`; `--fork` |
| List/delete/export/import | yes | E1-E2 | `session list --format json`; export/import JSON |
| Cross-directory/machine | partial | E1-E2 | `--dir`, server and import/export; retention unknown |
| Compaction/upgrade | unknown | E1-E2 | not verified |
| Models/providers/BYOK/local/reasoning | yes | E1-E2 | `models`; `provider/model`; `--variant`; many upstreams |
| Per-run/local tokens and cost | yes | E1-E2 | events and `stats --days ...` |
| Upstream account quota remaining | not-applicable | E2 | aggregator cannot expose one universal balance |

## Automation, workspace, and operations

| Capability | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Agents/plugins/instructions/MCP | yes | E1-E2 | agent, plugin, MCP commands |
| ACP/local server/API | yes | E1 | preferred interfaces |
| Permissions/sandbox | partial | E1 | deny rules exist; skip flag unsafe; OS sandbox unknown |
| Git/checkpoints/images/browser/logs | partial | E1-E2 | attachments/GitHub agent/log flags; remaining unknown |
| Recovery/offline/stability | partial | E1-E3 | local server helps reconnect; schema versioning unknown |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | local server or ACP; JSON CLI fallback |
| Launch new | `opencode run --format json --model {model} {prompt}` |
| Resume by ID | `opencode run --format json --session {sessionId} {prompt}` |
| Session/parser | JSON events; capture session ID and require terminal/error event |
| Credits | retain local `opencode stats`; label as local estimated history |
| Cancellation/recovery | terminate turn/client, reconnect server, resume ID |
| Security / complexity / recommendation | explicit deny policy and isolated cwd; medium; supported |

### App delta and proposed tests

Always pass `--format json`, including resume; avoid
`--dangerously-skip-permissions`; evaluate a long-lived server/ACP client. Add
fixtures for session list, fork, import/export, errors, cancellation, plugin log
contamination and local stats parsing across locale/theme changes.

## Unknowns and next verification

Verify schema versioning/final marker, signals, server authentication,
compaction, session retention and whether per-event costs are actual or estimates.

