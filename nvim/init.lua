-- Set up leader key before lazy
vim.g.mapleader = " "
vim.g.maplocalleader = " "

-- Load basic options
require("user.options")
require("user.autocmds")
require("user.keymaps")
require("user.lazygit").setup()

-- Bootstrap lazy.nvim
require("user.lazy")

-- Load LSP configurations that aren't handled by lazy
require("user.lsp.handlers").setup()
