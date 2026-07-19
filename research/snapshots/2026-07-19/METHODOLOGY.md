# Snapshot methodology and shared evidence

Research was performed on 2026-07-19 (Australia/Sydney) from Linux
6.6.87.2-microsoft-standard-WSL2 x86_64, Node 24.12.0, pnpm 10.33.2 and
Python 3.14.6. The repository had no earlier dated snapshot, so this is the
baseline rather than a trend comparison.

Local evidence was limited to non-mutating identity/help commands from `/tmp`:

```text
copilot --version       GitHub Copilot CLI 1.0.63
gemini --version        0.46.0
codex --version         codex-cli 0.144.4
opencode --version      1.15.13
agy --version           1.1.4
grok --version          grok 0.2.103 (89c3d36fb6)
pi --version            0.76.0
```

For each installed CLI, `<cli> --help` was captured on 2026-07-19. Additional
commands were `codex exec --help`, `codex exec resume --help`, `opencode run
--help`, `opencode session --help`, `opencode session list --help`, and `grok
agent --help`. No authenticated agent prompt was run, no account identifier or
secret was captured, and no untrusted agent was aimed at this repository.

`yes` below means verified by official documentation or the recorded CLI at the
named version; observed runtime behavior requiring authentication is separately
marked `not-tested`. Absence from documentation is `unknown`, not `no`.

