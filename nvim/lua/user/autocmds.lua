local api = vim.api

local rust_group = api.nvim_create_augroup("Rust", { clear = true })
api.nvim_create_autocmd("BufWritePost", {
	command = "silent !cargo fmt",
	group = rust_group,
	pattern = "*.rs",
})

local js_group = api.nvim_create_augroup("js", { clear = true })
api.nvim_create_autocmd("BufWritePre", {
  buffer = bufnr,
  callback = function()
      vim.lsp.buf.format({ bufnr = bufnr })
  end,
	group = js_group,
	pattern = "*.tsx,*.ts,*.js,*.jsx,*.vue",
})
