# Dated snapshots

Research runs are stored in append-only directories:

```text
YYYY-MM-DD/
├── SUMMARY.md
└── <provider-slug>.md
```

Use `YYYY-MM-DD-r2`, `-r3`, and so on for additional complete runs on the same
date. Do not edit historical findings to match newer behavior. If an old report
contains an error, explain the correction and link the affected report from the
next dated `SUMMARY.md`.

Each run must cover every provider listed in `../PROVIDERS.md` as of that run.
Copy the templates from `../templates/`; do not link to mutable external notes as
a substitute for preserving the result here.
