local api = vim.api

local rust_group = api.nvim_create_augroup("Rust", { clear = true })
api.nvim_create_autocmd("BufWritePost", {
	command = "silent !cargo fmt",
	group = rust_group,
	pattern = "*.rs",
})

-- Spelling ignore patterns
local function applyCustomSyntax()
  vim.cmd([[syntax match uuidPattern "\v[0-9a-fA-F]{8}(\-[0-9a-fA-F]{4}){3}\-[0-9a-fA-F]{12}" containedin=ALL]])
  vim.cmd([[hi! link uuidPattern NoSpell]])
  vim.cmd([[syntax match hexColor "#\x\{3,4}\|#[0-9a-fA-F]\{6}\|#[0-9a-fA-F]\{8}" containedin=ALL]])
  vim.cmd([[hi! link hexColor NoSpell]])
end

vim.api.nvim_create_autocmd("BufEnter", {
    pattern = "*",
    callback = applyCustomSyntax,
})
