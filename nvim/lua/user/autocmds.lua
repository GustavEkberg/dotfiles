local api = vim.api

local rust_group = api.nvim_create_augroup("Rust", { clear = true })
api.nvim_create_autocmd("BufWritePost", {
	command = "silent !cargo fmt",
	group = rust_group,
	pattern = "*.rs",
})
