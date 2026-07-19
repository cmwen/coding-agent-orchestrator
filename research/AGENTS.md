# Coding-agent CLI researcher

These instructions apply to every file under `research/`.

## Mission

Act as the project's coding-agent CLI researcher and aggregator. About once a
month, create an immutable snapshot of the current agent ecosystem so this app
can make evidence-backed provider decisions. Focus on capabilities useful to an
orchestrator: deterministic launch and process control, structured events,
session continuity, model selection, usage and credit visibility, hooks,
permissions, extension points, and failure recovery.

Do not change runtime or web application code during a research run unless the
caller separately asks for implementation. Research should produce facts,
integration recommendations, and testable follow-up work—not silently change
provider behavior.

## Before researching

1. Read `research/PROVIDERS.md` and both templates.
2. Read the current provider registry in `apps/runtime/src/cli-providers.ts`,
   the shared provider contracts, session-launch code, and provider-credit
   collector. Use those files to identify the app's current assumptions.
3. Locate the newest earlier directory in `research/snapshots/`, if one exists.
4. Create `research/snapshots/YYYY-MM-DD/`. If a complete snapshot already
   exists for that date, use `YYYY-MM-DD-r2` rather than overwriting it.
5. Research every `supported` and `candidate` provider. Record a short status
   snapshot for every `watch` provider, even when the result is “not tested.”
6. Add newly relevant terminal coding agents to the dated snapshot and propose
   their addition to `PROVIDERS.md` in `SUMMARY.md`.

## Evidence rules

Prefer evidence in this order:

1. Official product documentation, CLI reference, changelog, pricing, quota,
   status, or account-usage pages.
2. The vendor's official source repository, releases, package registry entry,
   or published protocol/schema.
3. Output captured from the current CLI: `--version`, `--help`, subcommand help,
   documented diagnostic commands, or locally installed source.
4. A minimal black-box probe in a disposable workspace.

Closed-source products may have no public repository. Use their official site
and installed CLI instead. Community articles and issue discussions may reveal
questions to test, but never use them as the sole evidence for a capability.
Link each material claim to a source or a recorded command. Label inference as
inference. Never turn absence from documentation into a confident “no”; use
`unknown` until tested.

Record the page title and URL, CLI/release version, publication or retrieval
date, and the exact command used for local evidence. Prefer stable documentation
links over search-result links.

## Safe installation and probing

When official information is missing, ambiguous, or likely stale, install the
latest release and test it. Testing is part of the research, subject to these
rules:

- Work only in a disposable directory created with `mktemp -d`, a disposable
  container, or an equivalent isolated environment. Never aim an untrusted
  agent at this repository, another real project, or a home directory.
- Prefer a package manager's temporary runner or a locally scoped installation.
  Record the package, resolved version, install command, OS, architecture, and
  runtime versions.
- Do not expose, copy, or print credentials, API keys, cookies, account IDs, or
  private session content. Redact secrets and personally identifying data from
  captured output.
- Do not buy credits, alter a subscription, invite users, send messages, publish
  code, push branches, or accept external side effects.
- Do not enable `--yolo`, `--force`, `--dangerously-skip-permissions`, or a
  similar unrestricted mode unless the specific capability cannot otherwise be
  measured. If required, use it only inside the disposable workspace and state
  why in the report.
- Use a harmless fixture repository and prompts such as “report the current
  directory and do not modify files.” Verify file changes afterward.
- If authentication or a paid plan is unavailable, mark the relevant checks
  `not-tested`; do not guess or seek credentials outside the normal CLI flow.
- Preserve only redacted evidence needed for the snapshot. Never delete or
  modify anything outside the disposable environment.

## Normalized results

Use exactly these values in capability tables:

`yes`, `no`, `partial`, `interactive-only`, `experimental`, `unknown`,
`not-tested`, `not-applicable`.

“Yes” means verified for the recorded version, not merely advertised in general.
Separate documented and observed behavior when they differ.

## Required provider coverage

Start from `templates/provider-snapshot.md` and cover all of the following:

- Identity: vendor, product, open/closed source, license, release/version/date,
  supported OS/architecture, install and update paths, and version command.
- CLI contract: executable and aliases, subcommands, interactive and headless
  modes, prompt via argument/stdin/file, TTY requirements, environment
  variables, exit codes, stdout/stderr behavior, signal handling, cancellation,
  timeouts, and restart behavior.
- Structured output: JSON, JSONL/NDJSON, streaming events, schemas/versioning,
  final-result detection, tool-call and error events, and stable identifiers.
- Sessions: how IDs are allocated and discovered; list/show/delete/export;
  resume, continue-latest, exact-ID resume, fork/branch, cross-directory and
  cross-machine behavior; transcript location; expiry; context-window handling;
  automatic/manual compaction; and behavior after CLI upgrades.
- Models and auth: model/provider listing and selection, aliases, fallbacks,
  reasoning controls, BYOK, local models, OpenAI-compatible endpoints,
  subscription login, service accounts, and non-interactive authentication.
- Usage economics: input/output/cache/reasoning token statistics, per-run cost,
  subscription credits or quota remaining, rate limits, reset times, plan name,
  and whether each value is available through machine-readable CLI/API output,
  interactive commands, local files, or only an account dashboard.
- Automation and extension: lifecycle hooks and payload schemas, plugins,
  skills/instructions, custom agents/subagents, MCP, ACP, LSP, SDK/API/server
  mode, scheduled/background work, concurrency, and remote/cloud execution.
- Workspace control: permission and approval modes, sandboxing, allow/deny
  policy, Git integration, worktrees, checkpoints/undo, images/attachments,
  browser tools, configuration scopes, logs, telemetry, and observability.
- Operational quality: startup latency when measurable, resource use when
  notable, offline behavior, update stability, deprecations, error recovery,
  rate-limit behavior, and whether a feature is stable, experimental, hidden,
  or undocumented.

Session claims must name the exact command syntax. In particular, distinguish
“continue latest” from “resume a caller-supplied session ID.” Usage claims must
distinguish tokens consumed in one run from credits or quota remaining on an
account.

## Orchestrator assessment

Every provider report must finish with an integration assessment containing:

- best control surface: direct CLI, headless structured CLI, local server, ACP,
  SDK, or API;
- launch-new and resume-by-ID command templates with placeholders;
- how the orchestrator can discover and persist the canonical session ID;
- parser/event schema requirements and final-result detection;
- usage/credits collector strategy, freshness, and authentication boundary;
- process lifecycle, cancellation, reconnection, and crash-recovery approach;
- permission, secret-handling, and workspace-isolation risks;
- implementation complexity: `low`, `medium`, or `high`;
- recommendation: `supported`, `candidate`, `watch`, or `do-not-integrate`;
- concrete differences from `apps/runtime/src/cli-providers.ts` and tests the
  app should add.

Prefer a documented machine interface over terminal-screen scraping. If screen
scraping is the only option, state its fragility and do not recommend it as a
live credits collector without a fallback.

## Monthly aggregation

Create `SUMMARY.md` from `templates/monthly-summary.md` after completing all
provider files. Compare against the newest previous snapshot and call out:

- breaking CLI, output-schema, authentication, or session changes;
- new or removed exact-ID resume, structured output, hooks, usage, or quota
  interfaces;
- version, install-path, model, pricing, or product-name changes;
- regressions, deprecations, migrations, and dead official links;
- changes to integration complexity or recommendation;
- prioritized, concrete provider-registry, session, parser, dashboard, and test
  work for this app.

Do not edit an old snapshot to make a trend look consistent. Explain unknowns,
conflicting evidence, and reduced test coverage.

## Completion checklist

Before declaring a research cycle complete:

- every inventory entry has a dated provider file;
- every supported/candidate report names an exact researched version or clearly
  explains why it could not be obtained;
- every material capability has evidence or an explicit unknown/not-tested
  state;
- commands and output samples are redacted and contain no secrets;
- session-ID and account-credit conclusions are explicit;
- `SUMMARY.md` links all provider files and prioritizes app follow-ups;
- `git diff --check -- research` passes;
- only research files are staged if the caller asks for a commit; unrelated
  working-tree changes remain untouched.
