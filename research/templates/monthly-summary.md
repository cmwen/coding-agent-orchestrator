# Coding-agent ecosystem snapshot — <YYYY-MM-DD>

## Run metadata

| Field | Value |
| --- | --- |
| Started / completed | `<ISO-8601>` / `<ISO-8601>` |
| Previous snapshot | `<relative link or none>` |
| Environment | `<OS/architecture and relevant runtimes>` |
| Coverage | `<researched>/<inventory total>` |
| Authenticated probes | `<providers, redacted>` |
| Not tested | `<providers and reasons>` |

## Executive summary

Summarize material ecosystem changes, the strongest current orchestration
interfaces, exact-ID session-resume coverage, and machine-readable account quota
coverage.

## Provider matrix

Link every provider name to its report. Use normalized result values.

| Provider | Tier | Version | Headless | JSON stream | Exact-ID resume | Hooks | Model selection | Account credits/quota | Best interface | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `<provider>` | | | | | | | | | | |

## Changes since the previous snapshot

### Breaking changes and migrations

- `<provider: evidence-backed change and app impact>`

### New capabilities

- `<new session, JSON, hook, protocol, model, or usage interface>`

### Regressions, removals, and deprecations

- `<regression and evidence>`

### Recommendation changes

| Provider | Previous | Current | Reason |
| --- | --- | --- | --- |
| | | | |

## Session continuation comparison

Separate continue-latest from caller-supplied exact-ID resume. Note how each
canonical ID is captured, persisted, resumed, forked, and expired.

## Credits and usage dashboard comparison

Separate per-run token/cost telemetry from subscription credit or quota
remaining. Rank interfaces by reliability: documented machine API/CLI, stable
local state, interactive-only command, account page, unavailable.

## Orchestrator opportunities

Prioritize concrete changes by user impact, evidence confidence, implementation
cost, and regression risk.

| Priority | Area | Provider(s) | Proposed app change | Evidence | Tests / acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| `P0-P3` | | | | | |

## Inventory changes proposed

List new providers, tier changes, product renames, migrations, and dead or
redirected official links. Do not silently rewrite history.

## Research limitations

Document unavailable authentication, plan-specific behavior, unsupported test
platforms, conflicting evidence, installation failures, and any capabilities
left unknown.

## Provider reports

- `[Provider](./provider-slug.md)`
