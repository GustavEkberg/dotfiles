# Claude adapter

`../opencode/` is authoritative for shared instructions, skills, commands,
agents, permissions, MCP servers, and reference directories. `settings.json`
contains only Claude-specific preferences and the optional Herdr integration.

Regenerate after changing shared settings or agents:

```sh
bun claude/sync.ts
bun claude/sync.ts --check
bun test claude/adapter.test.ts
```

Active links:

| Path | Repository target |
| --- | --- |
| `~/.claude/CLAUDE.md` | `claude/generated/CLAUDE.md` |
| `~/.claude/settings.json` | `claude/generated/settings.json` |
| `~/.claude/agents` | `claude/generated/agents` |
| `~/.claude/skills` | `opencode/skill` |
| `~/.claude/commands` | `opencode/command` |
| `~/.claude/keybindings.json` | `claude/keybindings.json` |
| `~/.config/opencode/AGENTS.md` | `opencode/AGENTS.md` |

Generated files are ignored and must not be hand-edited. The local `dotfiles`
marketplace loads `claude/mcp` in place, without a copied plugin or launcher
flags. Its generated MCP config uses the same commands, environment, timeouts,
and Playwright loopback restrictions as OpenCode. Restart Claude after syncing.

On a new machine, register the repo-local plugin once:

```sh
claude plugin marketplace add "$HOME/code/dotfiles/claude"
claude plugin install opencode@dotfiles --scope user
bun claude/sync.ts
```

Remove a legacy user-scoped QMD entry with `claude mcp remove qmd --scope user`
after the plugin is installed, so Claude starts only the repo-defined server.

Claude uses deny/ask/allow precedence rather than OpenCode's last-match wins.
The adapter rejects rule ordering it cannot preserve. Harness defaults and
model/provider configuration remain native to each tool. OpenCode plugins need
explicit Claude adapters; the QMD no-rerank hook is provided here.

Claude agents are generated from OpenCode frontmatter and prompt bodies. Their
scoped hook reads the canonical permissions on every tool call. Compound Bash
commands and shell expansions are denied for restricted agents; issue each
whitelisted command as a separate tool call. Session-wide permissions still
apply to allowed agent calls.

Claude's credentials, transcripts, caches, synced account skills, plugin
registry, and generated Herdr hook remain application-managed local state.
The old ignored `claude-settings.json` is no longer an active settings source.
