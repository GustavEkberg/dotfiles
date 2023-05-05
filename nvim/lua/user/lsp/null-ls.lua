local null_ls_status_ok, null_ls = pcall(require, "null-ls")
if not null_ls_status_ok then
	return
end

local b = null_ls.builtins

local sources = {
	-- Formatting
	-- https://github.com/jose-elias-alvarez/null-ls.nvim/tree/main/lua/null-ls/builtins/formatting
	-- b.formatting.prettier,
	b.formatting.stylua,
	b.formatting.eslint,
	-- b.formatting.rustfmt,

	-- Diagnostics
	-- https://github.com/jose-elias-alvarez/null-ls.nvim/tree/main/lua/null-ls/builtins/diagnostics
	b.diagnostics.eslint,
	-- b.diagnostics.pylint,

	-- Completion
	-- b.code_actions.cspell,
	--
	-- Hover
	-- https://github.com/jose-elias-alvarez/null-ls.nvim/tree/main/lua/null-ls/builtins/hover
	--
}
null_ls.setup({
	debug = false,
	sources = sources,
})
