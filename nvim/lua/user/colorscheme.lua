-- local colorscheme = "tokyonight-night"
local colorscheme = "bluloco-dark"
local status_ok, _ = pcall(vim.cmd, "colorscheme " .. colorscheme)
if not status_ok then
	return
end

vim.cmd("hi Visual guibg=#F1F1F1")
-- vim.cmd("highlight NonText guibg=none")
-- vim.cmd("highlight Normal guibg=none")
-- require(colorscheme).setup({
-- 	style = "darker",
-- })
-- require(colorscheme).load()
