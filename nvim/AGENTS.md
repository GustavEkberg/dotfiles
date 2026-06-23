# AGENTS.md - Neovim

Full Lua Neovim config using lazy.nvim. Keep this file scoped to Neovim traps; root `AGENTS.md` covers repo-wide style.

## Structure

```
nvim/
|-- init.lua                 # entry point
|-- lazy-lock.json           # Lazy-managed plugin lockfile
|-- lua/plugins/             # lazy.nvim plugin specs by concern
|-- lua/user/                # options, keymaps, autocmds, utilities
`-- lua/user/lsp/            # handlers, stubs, server overrides
```

## Load Order

`init.lua` sets leader keys, then requires:

1. `user.options`
2. `user.autocmds`
3. `user.keymaps`
4. `user.lazy`
5. `user.lsp.handlers`

`user.keymaps` runs before lazy.nvim setup. Do not require plugin modules there unless deferred inside callbacks or safely guarded.

## Where To Look

| Task | Location | Notes |
|------|----------|-------|
| Plugin specs | `lua/plugins/*.lua` | Group by concern; return spec tables |
| Lazy bootstrap | `lua/user/lazy.lua` | Auto-clones lazy.nvim if absent |
| Options | `lua/user/options.lua` | Includes Augment workspace path |
| Keymaps | `lua/user/keymaps.lua` | Pre-lazy boundary |
| Autocmds | `lua/user/autocmds.lua` | Rust format, spelling, large-file hook |
| Large files | `lua/user/large_file.lua` | `:OptimizeBuffer`, `:RestoreBuffer` |
| LSP stack | `lua/plugins/lsp.lua`, `lua/user/lsp/handlers.lua` | Mason, lspconfig, conform, lint |
| Server overrides | `lua/user/lsp/servers/*.lua` | `eslint`, `pyright` |

## Conventions

- 2-space indentation; spaces, not tabs.
- `snake_case` filenames/functions.
- Utility modules use `local M = {}` and `return M`.
- Plugin files live in `lua/plugins/`; user logic lives in `lua/user/`.
- Guard optional plugin loads with `pcall(require, ...)` or existing helper patterns.
- Prefer single quotes when touching nearby code, but preserve local consistency.
- Keep performance guardrails: large-file detection, cmp throttling, telescope preview limits.

## LSP Notes

- TypeScript uses `pmizio/typescript-tools.nvim`, not generic `ts_ls`.
- Mason installs `pyright`, `html`, `tailwindcss`, `prismals`, `lua_ls`, `bashls`, `jsonls`, `eslint`, `yamlls`.
- Formatters: `prettier`, `ruff`; linter: `mypy`.
- Deprecated stubs exist for compatibility: `lua/user/lsp/lspconfig.lua`, `lua/user/lsp/mason.lua`.

## Anti-Patterns

- Do not delete deprecated LSP stubs.
- Do not add unguarded plugin `require()` calls in pre-lazy modules.
- Do not remove `large_file.lua` behavior without replacement.
- Do not re-enable `render-markdown.nvim` in `lua/plugins/markdown.lua`; disabled as problematic.
- Do not hand-edit `lazy-lock.json` casually; update through Lazy intentionally.
- Do not hand-edit `spell/*.spl` compiled spell files.

## Validation

```sh
nvim --headless "+Lazy! check" +qa
nvim --headless "+checkhealth" "+w /tmp/nvim-health.log" +qa
luacheck nvim/lua/ --no-unused-args
```

Repo-local validation may need:

```sh
XDG_CONFIG_HOME=/Users/abraxas/code/dotfiles nvim --headless "+Lazy! check" +qa
```
