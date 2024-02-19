local null_ls_status_ok, null_ls = pcall(require, "null-ls")
if not null_ls_status_ok then
	return
end

local b = null_ls.builtins

local sources = {
	-- Formatting
	-- https://github.com/jose-elias-alvarez/null-ls.nvim/tree/main/lua/null-ls/builtins/formatting
	b.formatting.prettier,
	b.formatting.black,
	-- b.formatting.rustfmt,

	-- Diagnostics
	-- https://github.com/jose-elias-alvarez/null-ls.nvim/tree/main/lua/null-ls/builtins/diagnostics
	b.diagnostics.eslint,

	-- Completion
	-- b.code_actions.cspell,
	--
	-- Hover
	-- https://github.com/jose-elias-alvarez/null-ls.nvim/tree/main/lua/null-ls/builtins/hover
	--
}

local augroup = vim.api.nvim_create_augroup("LspFormatting", {})

null_ls.setup({
 border = nil,
  cmd = { "nvim" },
  debounce = 250,
  debug = false,
  default_timeout = 5000,
  diagnostic_config = {},
  diagnostics_format = "#{m}",
  fallback_severity = vim.diagnostic.severity.ERROR,
  log_level = "warn",
  notify_format = "[null-ls] %s",
  root_dir = require("null-ls.utils").root_pattern(".null-ls-root", "Makefile", ".git"),
  temp_dir = nil,
  update_in_insert = false,
	sources = sources,
  on_attach = function(client, bufnr)
  if client.supports_method("textDocument/formatting") then
    vim.api.nvim_clear_autocmds({ group = augroup, buffer = bufnr })
    vim.api.nvim_create_autocmd("BufWritePre", {
      group = augroup,
      buffer = bufnr,
      callback = function()
        vim.lsp.buf.format()
      end,
    })
		end
	end
})
