# AGENTS.md - Dotfiles

**Generated:** 2026-06-23
**Commit:** `2701471`
**Branch:** `main`

## Overview

Personal macOS Apple Silicon dotfiles. Config sources only; active-tool deployment is manual, with no stow/symlink automation and no CI/test harness.

## Structure

```
dotfiles/
|-- aerospace/          # AeroSpace config; copy to active path manually
|-- chrome/             # Buildless local Chrome MV3 extensions
|-- claude/             # Claude settings only
|-- fish/               # Fish config; may source private connections.sh
|-- fonts/              # Nerd Font binary
|-- keep/               # Vial keyboard exports; not hand-authored
|-- nvim/               # Full Neovim Lua config
|-- opencode/           # OpenCode config, commands, agents, skills, plugins
|-- pi/                 # Separate Pi skill/config experiments
|-- server/             # Server-specific commands, services, and config fragments
|-- scripts/            # task-loop.sh automation
|-- starship/           # Starship prompt
|-- tmux/               # tmux config + powerline scripts
|-- wezterm/            # WezTerm config
`-- install.sh          # Package bootstrap only; does not deploy configs
```

## Where To Look

| Task | Location | Notes |
|------|----------|-------|
| Neovim behavior | `nvim/AGENTS.md`, `nvim/init.lua`, `nvim/lua/` | Scoped guardrails live under `nvim/` |
| OpenCode behavior | `opencode/AGENTS.md`, `opencode/opencode.json` | Agent-wide engineering rules live there |
| OpenCode skills | `opencode/skill/AGENTS.md`, `opencode/skill/*/SKILL.md` | Skill packaging and reference/script rules |
| OpenCode plugin auth | `opencode/plugins/AGENTS.md` | Local OAuth plugin provenance |
| Chrome extensions | `chrome/AGENTS.md`, `chrome/*/manifest.json` | Manual Load unpacked flow |
| Shell config | `fish/config.fish` | Sources private `connections.sh` if present |
| Server-specific config | `server/AGENTS.md`, `server/` | Commands, services, OpenCode/Fish fragments for server hosts |
| Terminal stack | `wezterm/`, `tmux/`, `starship/` | Runtime configs require manual deployment |
| Bootstrap packages | `install.sh` | Installs packages only |
| Autonomous task loop | `scripts/task-loop.sh`, `opencode/command/complete-next-task.md` | PRD-driven OpenCode loop |

## Code Map

| Entry | Role |
|-------|------|
| `nvim/init.lua` | Sets leaders, loads `user.options`, `user.autocmds`, `user.keymaps`, `user.lazy`, `user.lsp.handlers` |
| `nvim/lua/user/lazy.lua` | Bootstraps lazy.nvim and imports `lua/plugins/*` |
| `nvim/lua/user/large_file.lua` | Disables expensive features for large buffers |
| `fish/config.fish` | Main shell config and PATH/tool setup |
| `tmux/tmux.conf` | tmux bindings/status/plugins; reload binding targets active `~/.tmux.conf` |
| `wezterm/wezterm.lua` | Terminal config and scrollback-to-vim event |
| `opencode/opencode.json` | OpenCode providers, plugin, MCP, permissions |
| `opencode/command/*.md` | Slash command prompts |
| `opencode/skill/*/SKILL.md` | Skill entry files loaded by OpenCode |
| `chrome/*/manifest.json` | Chrome extension entry points |

## Commands

No repo-wide test suite. Validate touched configs only:

```sh
fish -n fish/config.fish
bash -n scripts/task-loop.sh
bash -n install.sh
nvim --headless "+Lazy! check" +qa
nvim --headless "+checkhealth" "+w /tmp/nvim-health.log" +qa
wezterm --config-file wezterm/wezterm.lua show-keys 2>&1 | head -5
luacheck nvim/lua/ --no-unused-args
```

Chrome extension checks when edited:

```sh
python3 -m json.tool chrome/color-picker/manifest.json >/dev/null
python3 -m json.tool chrome/markdown-viewer/manifest.json >/dev/null
node --check chrome/color-picker/popup.js
node --check chrome/markdown-viewer/content.js
```

After editing any active config, reload the running tool or restart it. tmux has `prefix + r`; Chrome extensions must be reloaded in `chrome://extensions`.

## Conventions

- Minimal, surgical changes. Config repo; avoid framework/build-system creep.
- Manual deployment only. Do not add install/symlink automation without explicit request.
- Graceful degradation: optional tools/plugins must be feature-detected or guarded.
- Lua: 2 spaces, `snake_case`, utility modules return `local M = {}`, guard optional plugin `require()` with `pcall`.
- Fish: terse aliases, `type -q` checks, 2 spaces, no greeting, vi keybindings.
- Bash: strict mode for maintained scripts, 2 spaces, `local` vars, `case` + `shift` parsing.
- TOML: 2 spaces, inline comments where behavior is not obvious.
- JS in Chrome extensions: vanilla, 2 spaces, single quotes, no semicolons, no build step by default.

## Agent Rules

From `opencode/AGENTS.md`; apply repo-wide:

- Extreme concision in interactions and commits.
- Be critical, not agreeable.
- Commit format: `<type>: <description>`.
- No AI/Claude attribution in commits.
- Use `pnpm` instead of `npm` when applicable.
- Preserve type safety: no `any`, no non-null assertions, no type assertions.
- Split files past obvious complexity; do not grow monoliths.

## Anti-Patterns

- Do not programmatically install these configs from the repo.
- Do not create or commit secrets: `fish/connections.sh`, `.env*`, `secrets/*`.
- Do not create or commit server secrets: use ignored `server/local/`, `server/**/*.local`, or `server/**/*.secret`.
- Do not hand-edit `keep/*.vil`, binary fonts, compiled spell files, vendored Mermaid, or OOXML schemas.
- Do not delete Neovim deprecated stubs: `nvim/lua/user/lsp/lspconfig.lua`, `nvim/lua/user/lsp/mason.lua`.
- Do not replace `typescript-tools.nvim` with generic `ts_ls`.
- Do not assume `nvim --headless` validates this repo unless this repo is the active config or `XDG_CONFIG_HOME` is set.
- Do not treat `install.sh` as deploy automation; it installs packages only.

## Gotchas

- `CLAUDE.md` is a symlink to this file.
- `opencode/` has stricter engineering rules in its own `AGENTS.md`.
- `opencode/opencode.json` contains machine-local absolute paths by design.
- `tmux/tmux.conf` hardcodes an active shell path; verify local machine path before changing.
- `fish/config.fish` sources private `connections.sh`; it may not exist.
- `.gitignore` must cover any new local/private files before they are created.
