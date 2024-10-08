local colorscheme = "bluloco-dark"
local status_ok, _ = pcall(vim.cmd, "colorscheme " .. colorscheme)
if not status_ok then
  return
end

vim.cmd("highlight Normal guibg=NONE ctermbg=NONE")
vim.cmd("highlight Visual guibg=#632363 guifg=reverse")
vim.cmd("highlight NvimTreeNormal guibg=#000000")
vim.cmd("highlight NvimTreeNormalNC guibg=#000000")
vim.cmd("highlight TelescopeNormal guibg=#000000")
vim.cmd("highlight TroubleNormal guibg=#000000")
vim.cmd("highlight TelescopeBorder guibg=#000000")

-- vim.opt.guicursor = "n-v-c:block-Cursor/lCursor-blinkon1"
vim.api.nvim_set_hl(0, 'SpellBad', { fg = "#FF0000", undercurl = true })
