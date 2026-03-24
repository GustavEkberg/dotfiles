# AGENTS.md — Dotfiles

Personal dotfiles for macOS (Apple Silicon). Config-only repo — no build system, no CI, no tests.
Configs are manually symlinked to `~/.config/<tool>/` or `~/.<file>`. No stow/symlink automation.

## Repository Structure

```
aerospace/          # AeroSpace tiling WM (macOS) — aerospace.toml
fish/               # Fish shell — config.fish (single file, sources connections.sh if present)
fonts/              # SauceCodePro Nerd Font
keep/               # Keyboard layouts (Cantor Remix, Planck) — Vial JSON/VIL files
nvim/               # Neovim (full Lua config)
  init.lua          #   Entry point: leader key, loads user/* modules
  lua/plugins/      #   lazy.nvim plugin specs (completion, core, git, lsp, markdown, navigation, telescope)
  lua/user/         #   User modules (options, keymaps, autocmds, utils, lsp/)
opencode/           # OpenCode AI agent config (opencode.json, commands/, skills/, AGENTS.md)
scripts/            # task-loop.sh — autonomous PRD-driven dev loop
starship/           # Starship prompt — starship.toml
tmux/               # tmux config + powerline theme/segments
wezterm/            # WezTerm terminal — wezterm.lua
install.sh          # Bootstrap: brew/apt + cargo install (packages only, no symlinks)
```

## Validation Commands

No test suite. Validate configs per-tool:

```sh
# Fish — syntax check
fish -n fish/config.fish

# Bash scripts — syntax check
bash -n scripts/task-loop.sh
bash -n install.sh

# Neovim — plugin health / load check
nvim --headless "+Lazy! check" +qa
nvim --headless "+checkhealth" "+w /tmp/nvim-health.log" +qa

# WezTerm — parse config
wezterm --config-file wezterm/wezterm.lua show-keys 2>&1 | head -5

# Lua (if luacheck installed)
luacheck nvim/lua/ --no-unused-args
```

After editing any config: reload in the running tool or restart it. No hot-reload mechanism exists
except tmux (`prefix + r` reloads `tmux.conf`).

## Code Style

### Lua (Neovim)

- 2-space indentation, spaces not tabs
- `snake_case` for filenames and functions
- Module pattern: every utility file returns `local M = {}` table
- **Defensive loading** via `pcall(require, "module")` — never assume a plugin exists
- Single quotes preferred for strings (inconsistent in places but trend toward `'...'`)
- Plugin specs organized by concern: `completion`, `core`, `git`, `lsp`, `navigation`, `telescope`
- User modules separated from plugin specs: `lua/user/` vs `lua/plugins/`
- Deprecated files kept as empty stubs with comments to avoid breaking `require()` calls

### Fish

- Extremely terse aliases (single-char: `o`, `v`, `vv`)
- Conditional feature detection: `if type -q exa` / `if type -q bat` — graceful degradation
- 2-space indentation
- No greeting: `set -g fish_greeting`
- Vi keybindings enabled

### Bash

- Strict mode: `set -euo pipefail`
- 2-space indentation
- `local` for all function variables
- Argument parsing via `case` + `shift`

### TOML (aerospace, starship)

- 2-space indentation
- Inline comments for context

### General Principles

- **Graceful degradation**: every tool conditionally loads optional deps
- **Performance-conscious**: nvim has large-file detection (>1MB / >10K lines / >1000 char lines)
  that disables syntax, treesitter, LSP, spell. See `lua/user/large_file.lua`
- **Minimal changes**: surgical edits over broad refactors

## Neovim Architecture

**Plugin manager:** lazy.nvim (auto-bootstraps from GitHub)

**Entry flow:** `init.lua` → sets leader (Space) → requires:
  `user.options` → `user.autocmds` → `user.keymaps` → `user.lazy` → `user.lsp.handlers`

**LSP stack:**
- Mason manages server installs (pyright, html, tailwindcss, prismals, lua_ls, bashls, jsonls, eslint, yamlls)
- TypeScript uses `typescript-tools.nvim` (NOT generic ts_ls)
- Formatting: `conform.nvim` (prettier for JS/TS/CSS/HTML/JSON/YAML/MD, ruff for Python)
- Linting: `nvim-lint` (mypy for Python)
- Diagnostics: virtual text enabled, nerd font icons

**Completion:** nvim-cmp with sources: LSP > nvim_lua > buffer > path. Filters out "Text" kind.
60ms debounce, 200ms fetch timeout, auto-disabled for large files.

**Key plugins:** neo-tree (float), telescope (fzf-native), harpoon v2, leap.nvim, gitsigns,
diffview, lazygit.nvim, augment.vim (AI), which-key, treesitter (all grammars), trouble

**Colorscheme:** bluloco-dark (active)

## Key Patterns

1. **`pcall` guarding** — All optional plugin `require()` calls wrapped in `pcall`. Follow this pattern.
2. **Large-file system** — `user/large_file.lua` + `user/autocmds.lua` detects and optimizes.
   `:OptimizeBuffer` / `:RestoreBuffer` commands available.
3. **Deprecated stubs** — `lsp/lspconfig.lua` and `lsp/mason.lua` are empty stubs. Don't delete them.
4. **Auto-format on save** — Rust: `cargo fmt` via autocmd. JS/TS/Python: conform.nvim.
5. **Gitignored secrets** — `fish/connections.sh`, `.env*`, `secrets/*` — never create or commit these.

## Agent Rules

From `opencode/AGENTS.md` — these apply to all agent interactions in this repo:

- **Extreme concision** in commits and interactions. Sacrifice grammar for brevity.
- **Be critical, not agreeable.** Challenge suggestions, identify flaws. Disagreement > false validation.
- **Commit format:** `<type>: <description>` — types: feat, fix, docs, style, refactor, perf, test, chore, revert, build, ci
- **pnpm** over npm, always.
- **Type safety non-negotiable:** No `any`, no `!` (non-null assertion), no `as Type`.
- **Make illegal states unrepresentable:** ADTs, discriminated unions, parse at boundaries.
- **Fight entropy.** Leave the codebase better than you found it.
- **Failing tests acceptable** when they expose genuine bugs and test correct behavior.
- **Plans:** end with unresolved questions list (extremely concise).

## Gotchas

- No symlink automation — you cannot "install" configs from this repo programmatically
- `install.sh` only installs system packages, not configs
- Fish sources `connections.sh` at runtime — it's gitignored and may not exist
- `opencode/` has its own `AGENTS.md` with generic agent instructions (not dotfiles-specific)
- Keyboard layouts in `keep/` are binary/JSON exports from Vial — not hand-editable
