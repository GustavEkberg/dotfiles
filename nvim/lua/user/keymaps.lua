-- Shorten function name
local keymap = vim.keymap.set

local opts = { silent = true }

--Remap space as leader key
keymap("", "<Space>", "<Nop>", opts)
vim.g.mapleader = " "

keymap("v", "Y", '"*y') -- Yank to clipboard
keymap("n", "<F8>", "<cmd>:LspHover<CR>")
keymap("n", "<F12>", ":lua vim.lsp.buf.code_action()<CR>")
keymap("n", "<C-b>", "<cmd>bp<CR>")
keymap("v", "<C-r>", "*<esc>:%s///gc<left><left><left>")
keymap("n", "<C-d>", "<C-d>zz")
keymap("n", "<C-u>", "<C-u>zz")

keymap("n", "Q", "<cmd>:q<CR>")

-- Remove defaults from normal mode
keymap("n", "s", "<nop>")

local utils = require("user.utils")
local wk = utils.call_plugin("which-key")

wk.register({
	q = { "<cmd>bp<bar>bd #<CR>", "Remove file from buffer" },
	r = { "<cmd>e!<CR>", "Reload buffer" },
	w = { "<C-w>w", "Focus next window" },
	s = { "<cmd>w<CR>", "Save buffer" },
	b = {
		name = "Buffer",
		l = { "<cmd>ls<CR>", "List buffer" },
		h = { "<cmd>bp<CR>", "Next buffer" },
		g = { "<cmd>bn<CR>", "Previous buffer" },
		b = { "<cmd>bp<CR>", "Close current file" },
	},
}, { prefix = "<leader>" })
