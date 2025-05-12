local u = require("user.utils")

local status_which_key_ok, wk = pcall(require, "which-key")
if not status_which_key_ok then
	return
end

local status_cmp_ok, cmp_nvim_lsp = pcall(require, "cmp_nvim_lsp")
if not status_cmp_ok then
	return
end

local M = {}

M.capabilities = vim.lsp.protocol.make_client_capabilities()
M.capabilities.textDocument.completion.completionItem.snippetSupport = true
M.capabilities = cmp_nvim_lsp.default_capabilities(M.capabilities)

M.setup = function()
	local signs = {

		{ name = "DiagnosticSignError", text = "" },
		{ name = "DiagnosticSignWarn", text = "" },
		{ name = "DiagnosticSignHint", text = "" },
		{ name = "DiagnosticSignInfo", text = "" },
	}

	for _, sign in ipairs(signs) do
		vim.fn.sign_define(sign.name, { texthl = sign.name, text = sign.text, numhl = "" })
	end

	local config = {
		virtual_text = true, -- disable virtual text
		signs = {
			active = signs, -- show signs
		},
		update_in_insert = true,
		underline = true,
		severity_sort = true,
		float = {
			focusable = true,
			style = "minimal",
			border = "rounded",
			source = "always",
			header = "",
			prefix = "",
		},
	}

	vim.diagnostic.config(config)

	vim.lsp.handlers["textDocument/hover"] = vim.lsp.with(vim.lsp.handlers.hover, {
		border = "rounded",
	})

	vim.lsp.handlers["textDocument/signatureHelp"] = vim.lsp.with(vim.lsp.handlers.signature_help, {
		border = "rounded",
	})
end

local function lsp_keymaps(bufnr)
	-- COMMANDS
	-- Jump
	u.buf_command(bufnr, "LspReferences", vim.lsp.buf.references)
	u.buf_command(bufnr, "LspImplementation", vim.lsp.buf.implementation)
	u.buf_command(bufnr, "LspDeclaration", vim.lsp.buf.declaration)
	u.buf_command(bufnr, "LspDefinition", vim.lsp.buf.definition)
	u.buf_command(bufnr, "LspTypeDefinition", vim.lsp.buf.type_definition)

	-- Actions
	u.buf_command(bufnr, "LspHover", vim.lsp.buf.hover)
	u.buf_command(bufnr, "LspSignatureHelp", vim.lsp.buf.signature_help)
	u.buf_command(bufnr, "LspRename", function()
		vim.lsp.buf.rename()
	end)

	-- Issues / Diagnostics
	u.buf_command(bufnr, "LspDiagLine", vim.diagnostic.open_float)
	u.buf_command(bufnr, "LspDiagPrev", vim.diagnostic.goto_prev)
	u.buf_command(bufnr, "LspDiagNext", vim.diagnostic.goto_next)
	u.buf_command(bufnr, "LspDiagQuickfix", vim.diagnostic.setqflist)

	wk.add({
      { "<leader>a", group = "Actions" },
    { "<leader>aa", ":lua vim.lsp.buf.code_action()<CR>", desc = "Show Actions (extract code, move to file, etc)" },
    { "<leader>af", "<cmd>lua vim.lsp.buf.format({ async = true })<cr>", desc = "Format code" },
    { "<leader>ah", ":LspHover<CR>", desc = "Hover" },
    { "<leader>ar", ":LspRename<CR>", desc = "Rename Variable" },
    { "<leader>i", group = "Issues" },
    { "<leader>iN", ":LspDiagPrev<CR>", desc = "Show Previous Diagnostic" },
    { "<leader>id", ":LspDiagLine<CR>", desc = "Show Diagnostics" },
    { "<leader>in", ":LspDiagNext<CR>", desc = "Show Next Diagnostic" },
    { "<leader>j", group = "Jump to.." },
    { "<leader>jD", ":lua require('goto-preview').goto_preview_definition()<CR>", desc = "Preview definition" },
    { "<leader>jR", ":lua require('goto-preview').goto_preview_references()<CR>", desc = "Preview references" },
    { "<leader>jS", "<CMD>:sp<CR>:LspDefinition<CR>", desc = "Split Definition" },
    { "<leader>jd", ":LspDefinition<CR>", desc = "Definition" },
    { "<leader>ji", ":LspImplementation<CR>", desc = "Implementation" },
    { "<leader>jr", ":Telescope lsp_references<CR>", desc = "References" },
    { "<leader>js", "<CMD>:vs<CR>:LspDefinition<CR>", desc = "Vertical Split Definition" },
    { "<leader>jt", ":LspTypeDefinition<CR>", desc = "Type Definition" },
  })
end

local augroup = vim.api.nvim_create_augroup("LspFormatting", {})

M.on_attach = function(client, bufnr)
	lsp_keymaps(bufnr)

	-- Enable format on save for JavaScript and TypeScript files
	local file_type = vim.api.nvim_buf_get_option(bufnr, "filetype")
	if file_type == "javascript" or file_type == "typescript" or
	   file_type == "javascriptreact" or file_type == "typescriptreact" then
		vim.api.nvim_clear_autocmds({ group = augroup, buffer = bufnr })
		vim.api.nvim_create_autocmd("BufWritePre", {
			group = augroup,
			buffer = bufnr,
			callback = function()
				-- Check if eslint is attached to this buffer
				local eslint_client = nil
				-- Use vim.lsp.get_clients() instead of deprecated vim.lsp.get_active_clients()
				for _, c in pairs(vim.lsp.get_clients({ bufnr = bufnr })) do
					if c.name == "eslint" then
						eslint_client = c
						break
					end
				end

				if eslint_client then
					-- Use ESLint for formatting
					vim.cmd("EslintFixAll")
				elseif client.supports_method("textDocument/formatting") then
					-- Fallback to regular formatting if ESLint is not available
					vim.lsp.buf.format({
						bufnr = bufnr,
						timeout_ms = 2000,
						async = false
					})
				end
			end,
		})
	end
end

return M
