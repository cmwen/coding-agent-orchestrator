# Configuration

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `CODING_AGENT_ORCHESTRATOR_PORT` | `8791` | Runtime API port |
| `CODING_AGENT_ORCHESTRATOR_STORE_ROOT` | `~/.local/share/coding-agent-orchestrator` | Filesystem store root |
| `CODING_AGENT_ORCHESTRATOR_ORCHESTRATOR_TMUX_SESSION` | `coding-agent-orchestrator-orchestrator` | Shared tmux session name |
| `VITE_API_BASE_URL` | same origin | Web build API base URL |
| `VITE_BASE_PATH` | `/` | Static hosting base path |
| `CODING_AGENT_ORCHESTRATOR_SMTP_HOST` | unset | Optional schedule email SMTP host |
| `CODING_AGENT_ORCHESTRATOR_SMTP_PORT` | unset | Optional schedule email SMTP port |
| `CODING_AGENT_ORCHESTRATOR_SMTP_SECURE` | `false` | Optional SMTP TLS flag |
| `CODING_AGENT_ORCHESTRATOR_SMTP_USER` | unset | Optional SMTP username |
| `CODING_AGENT_ORCHESTRATOR_SMTP_PASS` | unset | Optional SMTP password |
| `CODING_AGENT_ORCHESTRATOR_SMTP_FROM` | unset | Optional sender address |
| `CODING_AGENT_ORCHESTRATOR_SMTP_REPLY_TO` | unset | Optional reply-to address |

## Local Example

```bash
export CODING_AGENT_ORCHESTRATOR_STORE_ROOT="$HOME/.local/share/coding-agent-orchestrator"
export CODING_AGENT_ORCHESTRATOR_PORT=8791
export CODING_AGENT_ORCHESTRATOR_ORCHESTRATOR_TMUX_SESSION=coding-agent-orchestrator
pnpm dev
```

## Ports

The new app intentionally avoids the source app ports:

- runtime: `8791`
- web dev: `5181`
- web preview: `4181`
