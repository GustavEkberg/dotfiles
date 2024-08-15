-- Shorten function name
local keymap = vim.keymap.set

local opts = { silent = true }

--Remap space as leader key
keymap("", "<Space>", "<Nop>", opts)
vim.g.mapleader = " "

keymap("v", "Y", '"*y') -- Yank to clipboard
keymap("n", "<F8>", "<cmd>:LspHover<CR>")
keymap("n", "<F12>", ":lua vim.lsp.buf.code_action()<CR>")
keymap("n", "<C-d>", "<C-d>zz")
keymap("n", "<C-u>", "<C-u>zz")
keymap("n", "<C-b>", "<cmd>b#<CR>")

keymap("n", "<C-h>", "<cmd>lua require('harpoon.ui').toggle_quick_menu()<CR>")

-- Move lines up and down
vim.api.nvim_set_keymap('n', '<C-j>', ':m .+1<CR>==', { noremap = true, silent = true })
vim.api.nvim_set_keymap('n', '<C-k>', ':m .-2<CR>==', { noremap = true, silent = true })
vim.api.nvim_set_keymap('v', '<C-j>', ":m '>+1<CR>gv=gv", { noremap = true, silent = true })
vim.api.nvim_set_keymap('v', '<C-k>', ":m '<-2<CR>gv=gv", { noremap = true, silent = true })

keymap("n", "Q", "<cmd>:q<CR>")

-- Remove defaults from normal mode
keymap("n", "s", "<nop>")
keymap("v", "u", "<nop>")
keymap("v", "U", "<nop>")

local utils = require("user.utils")
local wk = utils.call_plugin("which-key")


-- UUIDs
local insert_lowercase_uuid = function()
  local uuid = vim.fn.system('uuidgen'):gsub('\n', ''):lower()
  vim.api.nvim_put({uuid}, 'c', true, true)
end

wk.register({
	-- q = { "<cmd>bprevious | bdelete #<CR>", "Remove file from buffer" },
	r = { "<cmd>e!<CR>", "Reload buffer" },
	R = { "<cmd>LspRestart<CR>", "Restart LSP" },
	W = { "<C-w>W", "Focus Previous window" },
	w = { "<C-w>w", "Focus next window" },
	s = { "<cmd>w!<CR>", "Save buffer" },
  m = {
    name ="Homemade",
    z = { "<cmd>ZenMode<CR>", "Zen Mode" },
    m = { "<cmd>wincmd =<CR>", "Resize windows" },
    d = {
      insert_lowercase_uuid,
      "Insert UUID"
    }
  },



 c = {
    name = "ChatGPT",
    c = { "<cmd>ChatGPT<CR>", "ChatGPT" },
    e = { "<cmd>ChatGPTEditWithInstruction<CR>", "Edit with instruction", mode = { "n", "v" } },
    d = { "<cmd>ChatGPTRun docstring<CR>", "Docstring", mode = { "n", "v" } },
    a = { "<cmd>ChatGPTRun add_tests<CR>", "Add Tests", mode = { "n", "v" } },
    o = { "<cmd>ChatGPTRun optimize_code<CR>", "Optimize Code", mode = { "n", "v" } },
    s = { "<cmd>ChatGPTRun summarize<CR>", "Summarize", mode = { "n", "v" } },
    f = { "<cmd>ChatGPTRun fix_bugs<CR>", "Fix Bugs", mode = { "n", "v" } },
  },
}, { prefix = "<leader>" })
