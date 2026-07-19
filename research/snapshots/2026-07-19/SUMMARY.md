# Coding-agent ecosystem snapshot — 2026-07-19

## Run metadata

| Field | Value |
| --- | --- |
| Started / completed | `2026-07-19T11:30:00+10:00` / `2026-07-19T14:00:00+10:00` |
| Previous snapshot | none (baseline) |
| Environment | Linux WSL2 x86_64; Node 24.12.0; pnpm 10.33.2; Python 3.14.6 |
| Coverage | 23/23 inventory entries |
| Authenticated probes | none; existing credentials were not exercised or exposed |
| Not tested | Account-specific runtime behavior for all providers; non-installed candidates/watch products |

See [methodology and local versions](./METHODOLOGY.md). This baseline uses
official documentation/source plus non-mutating help/version output. No agent
prompt was run against this or another real repository.

## Executive summary

The strongest durable control surfaces are Factory Droid's SDK/streaming
JSON-RPC, Pi's strict JSONL RPC/SDK, Codex app server, Copilot SDK JSON-RPC, and
Amp's TypeScript SDK. Grok, Claude Code, Cursor, Gemini and OpenCode also expose
good structured headless streams with exact-ID resume.

The app's six-provider registry is materially ahead of its parsers: Codex and
OpenCode resume commands drop JSON output, Gemini and Copilot do not request
structured output, Grok omits streaming JSON, and Antigravity has no verified
machine stream. All six launchers currently select unrestricted/auto-approve
modes. These are the highest-priority integration gaps.

Google's product split is now operationally important. Consumer Gemini CLI
traffic moved to Antigravity in June 2026, while Gemini remains relevant for
enterprise/API-key modes. Antigravity is current but less automatable: exact
resume exists, yet a caller cannot preassign a new conversation ID and no JSON
flag appears in `agy 1.1.4` help.

Machine-readable account allowance remains rare. Copilot's `account.getQuota`
and Codex app-server rate limits are the best live collectors. OpenCode reports
local multi-provider history, not remaining upstream allowance. Kiro and
Antigravity expose interactive usage; most other tools provide per-run token or
cost telemetry but not subscription balance.

## Provider matrix

| Provider | Tier | Version | Headless | JSON stream | Exact-ID resume | Hooks | Model selection | Account credits/quota | Best interface | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [GitHub Copilot](./github-copilot.md) | supported | 1.0.63 | yes | yes | yes | yes | yes | yes | SDK | supported |
| [Gemini CLI](./gemini-cli.md) | supported | 0.46.0 | yes | yes | yes | yes | yes | unknown | structured CLI | candidate |
| [OpenAI Codex](./openai-codex.md) | supported | 0.144.4 | yes | yes | yes | yes | yes | yes | app server | supported |
| [OpenCode](./opencode.md) | supported | 1.15.13 | yes | yes | yes | partial | yes | not-applicable | local server | supported |
| [Google Antigravity](./google-antigravity.md) | supported | 1.1.4 | yes | unknown | yes | partial | yes | interactive-only | direct CLI/SDK | candidate |
| [Grok Build](./grok-build.md) | supported | 0.2.103 | yes | yes | yes | yes | yes | unknown | ACP | supported |
| [Pi](./pi.md) | candidate | 0.76.0 | yes | yes | yes | partial | yes | not-applicable | SDK/RPC | candidate |
| [Aider](./aider.md) | candidate | unknown | yes | unknown | unknown | unknown | yes | not-applicable | direct CLI | watch |
| [Claude Code](./claude-code.md) | candidate | unknown | yes | yes | yes | yes | yes | interactive-only | SDK | candidate |
| [Cursor Agent](./cursor-agent.md) | candidate | unknown beta | yes | yes | yes | unknown | yes | unknown | structured CLI | candidate |
| [Qwen Code](./qwen-code.md) | candidate | unknown | partial | unknown | unknown | partial | partial | unknown | unknown | watch |
| [Goose](./goose.md) | candidate | 1.36.0 | partial | unknown | unknown | unknown | yes | not-applicable | ACP/API | candidate |
| [OpenHands CLI](./openhands-cli.md) | candidate | unknown | yes | yes | unknown | unknown | partial | unknown | sandboxed CLI | watch |
| [Kiro CLI](./kiro-cli.md) | candidate | unknown | yes | unknown | yes | yes | yes | interactive-only | structured CLI | candidate |
| [Amp](./amp.md) | candidate | rolling | yes | yes | yes | partial | partial | unknown | SDK | candidate |
| [Factory Droid](./factory-droid.md) | candidate | unknown | yes | yes | yes | yes | yes | unknown | SDK/JSON-RPC | candidate |
| [Cline CLI](./cline-cli.md) | candidate | unknown | yes | partial | yes | yes | yes | unknown | ACP | candidate |
| [mini-SWE-agent](./mini-swe-agent.md) | watch | unknown | partial | unknown | unknown | unknown | partial | not-applicable | batch CLI | watch |
| [SWE-agent](./swe-agent.md) | watch | unknown | yes | partial | unknown | unknown | partial | not-applicable | batch artifacts | watch |
| [Augment Auggie](./augment-cli.md) | watch | unknown | yes | partial | yes | yes | partial | partial | ACP/JSON CLI | candidate |
| [Mistral Vibe](./mistral-vibe.md) | watch | unknown | yes | partial | yes | partial | yes | unknown | streaming CLI | candidate |
| [Kimi CLI](./kimi-cli.md) | watch | 1.49.0 | partial | unknown | unknown | partial | partial | unknown | ACP | watch |
| [Amazon Q CLI](./amazon-q-cli.md) | watch | unknown | unknown | unknown | unknown | unknown | unknown | unknown | interactive CLI | watch |

## Changes since the previous snapshot

This is the first snapshot, so there is no historical provider comparison.
The following are baseline-breaking findings relative to the app's present
assumptions rather than changes since an older research snapshot.

### Breaking changes and migrations

- Gemini CLI consumer sign-in was superseded by Antigravity; registry availability
  must be account-mode aware rather than a single `gemini` installed boolean.
- Kiro CLI 3.0 early access uses a session format incompatible with V2; V3
  sessions cannot resume in V2. Persist the engine/version with every ID.
- Kimi CLI's official repository announces migration to Kimi Code CLI and
  gradual wind-down, with automatic configuration/session migration.
- The inventory's Antigravity CLI documentation URLs are stale; the CLI root
  returned 404 and the usage URL could not be fetched. Current official plans,
  Google codelabs and the installed help are the usable evidence.

### New capabilities

- Grok Build `0.2.103` exposes streaming JSON, ACP stdio/server/leader modes,
  exact resume versus caller-chosen new UUID, fork, plugins and worktrees.
- Factory Droid documents bidirectional JSON-RPC with permission requests,
  interrupts, fork, compaction, token events and typed SDKs.
- Copilot exposes ACP and an SDK JSON-RPC session lifecycle in addition to JSONL.
- Auggie and Mistral Vibe now have enough documented headless/session structure
  to justify promotion from watch to candidate after pinned-version probes.

### Regressions, removals, and deprecations

- Gemini's consumer product route is the largest removal for the current app.
- Kiro V3 does not provide cross-engine session compatibility.
- Kimi CLI is being superseded; new integration should target its successor.
- Amp explicitly prioritizes rapid evolution over backward compatibility, so
  parser and SDK version pinning is mandatory.

### Recommendation changes

There is no earlier snapshot recommendation to compare. Proposed inventory
changes are:

| Provider | Previous inventory tier | Proposed tier | Reason |
| --- | --- | --- | --- |
| Augment Auggie | watch | candidate | JSON output, exact resume, JSON session list, hooks, ACP and credit commands |
| Mistral Vibe | watch | candidate | JSON/NDJSON, exact resume and explicit token/price budgets |
| Gemini CLI | supported | supported-legacy/candidate | consumer migration; retain enterprise/API-key use |
| Antigravity | supported | candidate until parser proven | no verified structured output or caller-chosen new ID |
| Kimi CLI | watch | migration watch | official successor/wind-down notice |

## Session continuation comparison

Exact caller-ID resume is verified in documentation/help for Copilot
(`--resume={id}`), Gemini (`--resume {uuid}`), Codex (`exec resume {id}`),
OpenCode (`run --session {id}`), Antigravity (`--conversation {id}`), Grok
(`--resume {id}`), Pi (`--session {id}`/RPC), Claude (`--resume {id}`), Cursor
(`--resume={id}`), Kiro (`chat --resume-id {id}`), Amp SDK, Factory Droid,
Cline, Auggie and Vibe.

Continue-latest is a separate capability (`--continue`, `--last`, or equivalent)
and must never supply the persisted ID. Caller-chosen IDs for new sessions are
verified for Copilot, Gemini, Grok, Pi and Factory. Antigravity cannot be assumed
to support this; discover its ID after launch. Kiro engine version must travel
with its ID. OpenCode, Codex, Amp and SDK/server integrations should persist the
canonical ID from typed initialization events.

## Credits and usage dashboard comparison

Reliability ranking:

1. Copilot SDK RPC `account.getQuota` and Codex app-server rate-limit RPC provide
   live allowance/reset/plan data behind the CLI's normal authentication.
2. Per-run typed usage is available from Codex, Claude, Factory, Pi and likely
   other structured streams; it is not remaining subscription credit.
3. OpenCode `stats` is local multi-provider token/cost history and must remain
   labeled as such.
4. Auggie exposes `--show-credits` and `account status`, but units, JSON shape and
   freshness need a pinned authenticated probe.
5. Antigravity and Kiro `/usage` are interactive-only. Do not screen-scrape them
   into a live collector without a documented fallback.
6. Multi-provider harnesses (Pi, OpenCode, Goose, Aider) generally require
   upstream-specific collectors; a universal account balance is not applicable.

## Orchestrator opportunities

| Priority | Area | Provider(s) | Proposed app change | Evidence | Tests / acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| P0 | Parser parity | Codex, OpenCode | Add JSON output to resume paths | Installed help | New and resume emit same parseable event family and terminal marker |
| P0 | Safety | all supported | Replace unconditional yolo/bypass flags with provider policy+sandbox mapping | Installed help/docs | Mutations require explicit configured policy; secrets redacted; cwd isolated |
| P0 | Product gating | Gemini/Antigravity | Make availability account/engine-aware and label Gemini legacy consumer path | Google official sources | Consumer migration error is actionable; enterprise/API key remains selectable |
| P1 | Structured launch | Copilot, Gemini, Grok | Always request JSONL/stream JSON on new and resume | Installed help/docs | Additive fields ignored; errors and final results deterministic |
| P1 | Session IDs | Antigravity | Mark bootstrap unsupported; persist only discovered validated ID | `agy 1.1.4 --help` | No synthetic ID passed; exact resume round-trip fixture |
| P1 | Control surfaces | Codex, Copilot, Grok, OpenCode | Spike app-server/SDK/ACP adapters | Official protocol docs/help | Initialize, prompt, permission, cancel, reconnect, resume contract tests |
| P1 | New providers | Factory, Pi, Claude | Prototype typed adapters | Provider reports | Pinned version, canonical ID, final event, cancellation and usage fixtures |
| P2 | Credits | Auggie | Probe account status and per-run credit units | Official CLI docs | Freshness/unit/auth documented; no token/session secrets logged |
| P2 | Session versioning | Kiro, Amp | Persist provider CLI/engine version with session metadata | Official breaking-change docs | Reject incompatible Kiro resume; parser fixture selected by version |
| P2 | Dashboard semantics | OpenCode and multi-provider CLIs | Rename local statistics distinctly from account remaining | Existing collector/docs | UI never labels estimated local cost as subscription credits |
| P3 | Batch jobs | SWE-agent family | Consider separate batch adapter, not chat provider | Official trajectory docs | Container-only execution; artifact/status ingestion and crash tests |

## Inventory changes proposed

- Promote `augment-cli` and `mistral-vibe` to candidate after an exact-version
  disposable probe confirms their documented schemas.
- Retain `gemini-cli` but annotate supported authentication modes and consumer
  migration; do not silently remove it.
- Track Kimi Code CLI as a new successor entry or rename/migration pair once its
  official executable, version command, ACP/session compatibility and install
  path are documented. Keep `kimi-cli` long enough to test migration.
- Replace stale Antigravity starting URLs with current official plans/codelabs
  and an official CLI reference when Google publishes a stable replacement.
- No additional newly relevant agent had enough official evidence in this run
  to add without duplicating an existing provider or successor.

## Research limitations

No authenticated black-box prompt was executed, so runtime exit codes, signal
handling, quotas, plan-specific behavior and cross-upgrade session durability
remain not-tested unless official docs explicitly establish them. Eleven
candidate and six watch CLIs were not installed; reports name this limitation
instead of guessing versions. Closed products may add undocumented interfaces,
but absence was recorded as `unknown`. Documentation retrieved in July 2026 is
fast-moving, particularly Amp, Kiro V3, Antigravity and the Kimi migration.

## Provider reports

- [GitHub Copilot](./github-copilot.md)
- [Gemini CLI](./gemini-cli.md)
- [OpenAI Codex](./openai-codex.md)
- [OpenCode](./opencode.md)
- [Google Antigravity](./google-antigravity.md)
- [Grok Build](./grok-build.md)
- [Pi](./pi.md)
- [Aider](./aider.md)
- [Claude Code](./claude-code.md)
- [Cursor Agent](./cursor-agent.md)
- [Qwen Code](./qwen-code.md)
- [Goose](./goose.md)
- [OpenHands CLI](./openhands-cli.md)
- [Kiro CLI](./kiro-cli.md)
- [Amp](./amp.md)
- [Factory Droid](./factory-droid.md)
- [Cline CLI](./cline-cli.md)
- [mini-SWE-agent](./mini-swe-agent.md)
- [SWE-agent](./swe-agent.md)
- [Augment Auggie](./augment-cli.md)
- [Mistral Vibe](./mistral-vibe.md)
- [Kimi CLI](./kimi-cli.md)
- [Amazon Q CLI](./amazon-q-cli.md)

