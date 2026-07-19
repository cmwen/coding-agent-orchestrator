# Amazon Q Developer CLI

## Snapshot metadata

| Field | Value |
| --- | --- |
| Research date / tier | 2026-07-19 / watch |
| Version / test | unknown current `q` CLI; not installed, not-tested |
| Source | AWS product; [official documentation](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line.html) |

## Executive finding and evidence

Amazon Q remains useful interactively for AWS development, but this run did not
establish an official headless JSON event stream or caller-supplied exact chat
resume command for `q`. AWS documents service conversation permissions, but
those console APIs are not evidence of a local coding-agent session protocol.

## Normalized capability status

| Area | Result | Notes |
| --- | --- | --- |
| Install/platform/version/source | partial | official AWS CLI product; exact version absent |
| Interactive/headless/prompt/non-TTY | partial | interactive `q` established; headless contract unknown |
| JSON/JSONL/schema/final/session IDs | unknown | no accepted local agent protocol this run |
| Exact resume/list/fork/export/compaction | unknown | console/IDE history must not be conflated with CLI |
| Models/auth/BYOK/local | partial | AWS identity and service models; details unverified |
| Tokens/cost/account quota | unknown | not-tested |
| Hooks/MCP/ACP/SDK/permissions | unknown | no stable orchestrator surface established |
| Sandbox/Git/images/logs/recovery | unknown | not-tested |

## Orchestrator integration assessment

| Decision | Assessment |
| --- | --- |
| Best interface | direct interactive CLI only today |
| Launch / resume | unavailable as stable headless templates |
| Parser / credits | do not scrape terminal / unavailable |
| Cancellation/security | process boundary; AWS credential isolation |
| Complexity / recommendation | high / watch |

### App delta, tests, and unknowns

No registry change. A future disposable probe should capture `q --version`, all
help/subcommands, non-TTY behavior, structured output, exact session handling,
IAM/auth boundary, exit codes and cancellation. Do not reuse Amazon Q console
conversation APIs without an explicit supported mapping.

