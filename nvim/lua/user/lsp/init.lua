-- LSP initialization is now handled by lazy.nvim plugins in lua/plugins/lsp.lua
-- This file just sets up handlers which are still used by the new config
require("user.lsp.handlers").setup()
