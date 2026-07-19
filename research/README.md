# Coding-agent provider research

This directory is the project's living compatibility record for coding-agent
CLIs. It is designed for a coding agent to run roughly once a month and produce
an append-only, evidence-backed snapshot that can guide provider work in the
orchestrator.

## Run a research cycle

Ask a coding agent working at the repository root to:

> Follow `research/AGENTS.md` and create this month's complete provider research
> snapshot. Do not change application code.

The agent should create:

```text
research/snapshots/YYYY-MM-DD/
├── SUMMARY.md
├── github-copilot.md
├── openai-codex.md
└── ...one file for every provider in PROVIDERS.md
```

Use `YYYY-MM-DD-r2` for a second complete run on the same date. Historical
snapshots are immutable; corrections belong in a new snapshot with a note in
the summary.

## Contents

- `AGENTS.md` defines the research method, safety rules, required capability
  matrix, and completion criteria.
- `PROVIDERS.md` is the provider inventory and official-source starting point.
- `templates/provider-snapshot.md` is the required per-provider report shape.
- `templates/monthly-summary.md` is the cross-provider comparison and change
  report.
- `snapshots/` contains dated research output.

The inventory is intentionally broader than the providers currently implemented
by the app. Researching candidates before integration keeps provider behavior,
session continuation, structured output, and quota collection decisions based
on current evidence rather than assumptions.
