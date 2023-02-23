-- Basics
vim.opt.fileencoding = "utf-8" -- the encoding written to a file
vim.opt.mouse = "a" -- allow the mouse to be used in neovim
vim.opt.termguicolors = true -- set term gui colors (most terminals support this)
vim.opt.smartcase = true
vim.opt.relativenumber = true

-- Lines
vim.opt.number = true -- set numbered lines
-- vim.opt.cursorline = true -- highlight the current line

-- Indentation
vim.opt.smarttab = true
vim.opt.smartindent = true -- make indenting smarter
vim.opt.autoindent = true
vim.opt.expandtab = true -- convert tabs to spaces
vim.opt.shiftwidth = 2 -- the number of spaces inserted for each indentation
vim.opt.tabstop = 2 -- insert 2 spaces for a tab

-- Interface
vim.opt.showtabline = 0

-- Splits
vim.opt.splitbelow = true -- force all horizontal splits to go below current window
vim.opt.splitright = true -- force all vertical splits to go to the right of current window

-- History
vim.opt.undofile = true -- enable persistent undo
vim.opt.backup = false -- creates a backup file
vim.opt.writebackup = false -- if a file is being edited by another program (or was written to file while editing with another program), it is not allowed to be edited
vim.opt.swapfile = false -- creates a swapfile

-- Performance
vim.opt.timeoutlen = 1000 -- time to wait for a mapped sequence to complete (in milliseconds)
vim.opt.updatetime = 300 -- faster completion (4000ms default)
