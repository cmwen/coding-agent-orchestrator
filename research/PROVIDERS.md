# Provider research inventory

Research all entries on every monthly run. `supported` means implemented by this
app today, not that every capability has been verified. `candidate` means it is
a serious integration target. `watch` keeps ecosystem coverage broad with a
lighter investigation until its orchestration surface merits deeper work.

Official URLs are starting points, not permanent truth. Validate redirects,
product renames, repository ownership, and current CLI names during each run.

## Supported

| Slug | Product | CLI | Official starting points |
| --- | --- | --- | --- |
| `github-copilot` | GitHub Copilot CLI | `copilot` | [CLI docs](https://docs.github.com/en/copilot/how-tos/copilot-cli), [repository](https://github.com/github/copilot-cli) |
| `gemini-cli` | Google Gemini CLI | `gemini` | [repository](https://github.com/google-gemini/gemini-cli), [quota docs](https://developers.google.com/gemini-code-assist/resources/quotas) |
| `openai-codex` | OpenAI Codex CLI | `codex` | [CLI docs](https://developers.openai.com/codex/cli/), [repository](https://github.com/openai/codex) |
| `opencode` | OpenCode | `opencode` | [CLI docs](https://opencode.ai/docs/cli/), [repository](https://github.com/anomalyco/opencode) |
| `google-antigravity` | Google Antigravity CLI | `agy` | [CLI docs](https://antigravity.google/docs/cli/), [usage command](https://antigravity.google/docs/cli/commands/usage) |
| `grok-build` | xAI Grok Build | `grok` | [overview](https://docs.x.ai/build/overview), [CLI reference](https://docs.x.ai/build/cli/reference) |

## Candidates

| Slug | Product | CLI | Official starting points |
| --- | --- | --- | --- |
| `pi` | Pi Coding Agent | `pi` | [repository and package guide](https://github.com/badlogic/pi-mono/blob/main/README.md) |
| `aider` | Aider | `aider` | [documentation](https://aider.chat/docs/), [repository](https://github.com/Aider-AI/aider) |
| `claude-code` | Anthropic Claude Code | `claude` | [documentation](https://code.claude.com/docs/en/overview), [hooks](https://code.claude.com/docs/en/hooks) |
| `cursor-agent` | Cursor Agent CLI | `cursor-agent` | [overview](https://docs.cursor.com/en/cli/overview), [output formats](https://docs.cursor.com/en/cli/reference/output-format) |
| `qwen-code` | Qwen Code | `qwen` | [repository](https://github.com/QwenLM/qwen-code) |
| `goose` | Goose | `goose` | [repository](https://github.com/aaif-goose/goose) |
| `openhands-cli` | OpenHands CLI | `openhands` | [quick start](https://docs.openhands.dev/openhands/usage/cli/quick-start), [repository](https://github.com/OpenHands/OpenHands-CLI) |
| `kiro-cli` | Kiro CLI | `kiro-cli` | [documentation](https://kiro.dev/docs/cli/), [sessions](https://kiro.dev/docs/cli/chat/), [hooks](https://kiro.dev/docs/cli/hooks/) |
| `amp` | Amp | `amp` | [owner's manual](https://ampcode.com/manual) |
| `factory-droid` | Factory Droid | `droid` | [CLI reference](https://docs.factory.ai/reference/cli-reference), [product](https://factory.ai/product/droids) |
| `cline-cli` | Cline CLI | `cline` | [CLI reference](https://docs.cline.bot/cli/cli-reference), [installation](https://docs.cline.bot/getting-started/installing-cline) |

## Watch

| Slug | Product | Likely CLI | Official starting points |
| --- | --- | --- | --- |
| `mini-swe-agent` | mini-SWE-agent | `mini` | [repository](https://github.com/SWE-agent/mini-swe-agent) |
| `swe-agent` | SWE-agent | `sweagent` | [repository](https://github.com/SWE-agent/SWE-agent) |
| `augment-cli` | Augment Code CLI | `auggie` | [documentation](https://docs.augmentcode.com/cli/overview) |
| `mistral-vibe` | Mistral Vibe | `vibe` | [repository](https://github.com/mistralai/mistral-vibe) |
| `kimi-cli` | Kimi CLI | `kimi` | [repository](https://github.com/MoonshotAI/kimi-cli) |
| `amazon-q-cli` | Amazon Q Developer CLI | `q` | [documentation](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line.html) |

## Inventory maintenance

During each run:

1. Verify every URL and CLI executable name.
2. Promote or demote providers when their integration surface changes, noting
   the reason in the dated `SUMMARY.md`.
3. Track superseded products long enough to document migration and session-data
   compatibility; do not silently remove them.
4. Add material new terminal agents, especially those exposing stable JSON,
   JSON-RPC, ACP, an SDK, hooks, exact-ID resume, or usage/quota APIs.
5. Keep IDE-only assistants out unless they also expose an automatable local CLI,
   server, protocol, or SDK relevant to this orchestrator.
