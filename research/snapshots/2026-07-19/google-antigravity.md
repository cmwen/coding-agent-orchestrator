# Google Antigravity CLI

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date/time | `2026-07-19T12:00:00+10:00` |
| Researcher / tier | OpenAI Codex / supported |
| Vendor / version | Google / `agy 1.1.4` installed |
| Install / environment | official installer; [shared environment](./METHODOLOGY.md) |
| Authentication | not-tested |
| Source | Closed product/CLI; official Google docs and local binary |

## Executive finding

Antigravity is Google's current consumer terminal surface and supports headless
prompting plus exact conversation resume. The CLI help exposes no structured
output flag or caller-chosen new conversation ID, so the current tmux/text
integration is fragile. Its `/usage` balance remains interactive-only.

## Evidence log

| ID | Kind | Source | Establishes |
| --- | --- | --- | --- |
| E1 | CLI output | `agy --version`; `agy --help` | Version, print mode, conversation resume, timeout, sandbox |
| E2 | official Google | [Hands-on codelab](https://codelabs.developers.google.com/antigravity-cli-hands-on) | Installer, interactive features, settings |
| E3 | official Google | [CLI codelab](https://codelabs.developers.google.com/sdd-agy-cli) | Current CLI help and skills/MCP workflow |
| E4 | official docs | [Plans](https://antigravity.google/docs/plans?app=cli) | Baseline/five-hour/weekly quota concepts |
| E5 | official Google | [Surface choice](https://cloud.google.com/blog/topics/developers-practitioners/choosing-your-surface-antigravity-20-antigravity-cli-antigravity-ide-or-antigravity-sdk) | CLI and SDK positioning |

## Installation, CLI, and structured output

| Capability | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Install/version/macOS/Linux/Windows | yes | E1-E2 | installer scripts; `agy --version` |
| Interactive / non-TTY headless / prompt arg | yes | E1 | `agy`; `agy -p {prompt}` |
| stdin/file | unknown | E1 | not documented; app currently shell-substitutes files |
| Timeout / sandbox / cancellation | partial | E1 | `--print-timeout`; `--sandbox`; signal behavior not-tested |
| JSON/JSONL/schema/final events | unknown | E1-E3 | no structured flag in `1.1.4` help |

## Sessions, models, auth, and economics

| Capability | Result | Evidence | Exact behavior |
| --- | --- | --- | --- |
| Creates ID / machine-readable capture | partial | E1 | CLI emits conversation text; format not stable |
| Continue latest / exact resume | yes | E1 | `--continue`; `--conversation {id}` |
| Caller-chosen new ID/list/export/fork | unknown | E1-E3 | no flags in help |
| Cross-surface/cloud | partial | E5 | shared harness advertised; exact durability not-tested |
| Model/agent selection/login | yes | E1-E3 | `--model`, `--agent`; Google sign-in |
| BYOK/local/OpenAI-compatible | unknown | E1-E3 | not established |
| Per-run tokens/cost | unknown | E1-E4 | no machine output verified |
| Account quota remaining | interactive-only | E4 | `/usage` or `/quota`; exact output not captured |

## Automation, workspace, and operations

| Capability | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Plugins/skills/agents/MCP | yes | E1-E3 | plugin and agent commands; official skills/MCP lab |
| Hooks/ACP/SDK | partial | E3,E5 | SDK exists; CLI ACP/hooks not confirmed in help |
| Permissions/sandbox/add-dir | yes | E1 | accept-edits/plan, sandbox and workspace paths |
| Git/checkpoint/images/browser/logs | partial | E1-E3 | tool surface advertised; logs flag; details unknown |
| Stability/migration | partial | E2-E5 | new fast-moving replacement for Gemini CLI |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best control surface | SDK if available; direct CLI fallback |
| Launch new | `agy --sandbox -p {prompt}` (cannot preassign canonical ID) |
| Resume by ID | `agy --conversation {sessionId} --sandbox -p {prompt}` |
| Session/parser | parse/redact text resume hint only until a machine API exists |
| Credits | `/usage` interactive fallback; do not screen-scrape live collector |
| Cancellation/recovery | process timeout/signal; rediscover ID before persisting |
| Security / complexity / recommendation | sandbox, no dangerous flag; high; candidate |

### App delta and proposed tests

The registry overstates robust session support and the launcher always uses
`--dangerously-skip-permissions`. Remove pre-bootstrap assumptions, use sandbox,
and add version-gated tests for text ID discovery, exact resume, timeout, login
failure and any future JSON/SDK contract. The two `antigravity.google/docs/cli`
inventory URLs returned 404/safety failures and should be replaced with current
docs/codelabs.

## Unknowns and next verification

Safely test authenticated print output, ID emission, exit codes, quota command,
cross-directory resume and the advertised SDK without scraping the TUI.

