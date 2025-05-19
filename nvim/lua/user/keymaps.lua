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
keymap("v", "u", "<nop>")
keymap("v", "U", "<nop>")

local utils = require("user.utils")
local wk = utils.call_plugin("which-key")

-- Registers
local esc = vim.api.nvim_replace_termcodes("<Esc>", true,true, true)
vim.fn.setreg("l","yoconsole.log('" .. esc .. "pa:'," .. esc .. "pa)" .. esc)
vim.fn.setreg("k","yoconsole.log('" .. esc .. "pa:'," .. esc .. "pa)" .. esc .. "dd" .. esc)


-- UUIDs
local insert_lowercase_uuid = function()
  local uuid = vim.fn.system('uuidgen'):gsub('\n', ''):lower()
  vim.api.nvim_put({uuid}, 'c', true, true)
end

-- Augment
keymap('i', '<C-l>', function() vim.api.nvim_call_function('augment#Accept', {}) end, { noremap = true })



wk.add({
    { "<leader>R", "<cmd>LspRestart<CR>", desc = "Restart LSP" },
    { "<leader>W", "<C-w>W", desc = "Focus Previous window" },
    { "<leader>r", "<cmd>e!<CR>", desc = "Reload buffer" },
    { "<leader>s", "<cmd>w!<CR>", desc = "Save buffer" },
    { "<leader>w", "<C-w>w", desc = "Focus next window" },

    { "<leader>m", group = "Homemade" },
    { "<leader>ms", "<cmd>Augment chat-toggle<CR>", desc="Augment chat"},
    { "<leader>ma", "<cmd>Augment chat<CR>", desc="Augment message"},
    { "<leader>md", insert_lowercase_uuid, desc = "Insert UUID" },
    { "<leader>mm", "<cmd>wincmd =<CR>", desc = "Resize windows" },
    { "<leader>mz", "<cmd>ZenMode<CR>", desc = "Zen Mode" },
    { "<leader>mp", "<cmd>OptimizeBuffer<CR>", desc = "Performance mode (optimize)" },
    { "<leader>mr", "<cmd>RestoreBuffer<CR>", desc = "Restore normal mode" },
    { "<leader>mc", "<cmd>ToggleCompletion<CR>", desc = "Toggle completion" },
})
