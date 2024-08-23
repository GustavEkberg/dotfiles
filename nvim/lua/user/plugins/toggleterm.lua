local utils = require("user.utils")
local toggleterm = utils.call_plugin("toggleterm")

toggleterm.setup({
  size = 20,
  hide_numbers = true,
  open_mapping = [[<c-s>]],
  shade_terminals = true,
  shading_factor = 2,
  start_in_insert = true,
  insert_mappings = true,
  persist_size = true,
  direction = "horizontal",
  close_on_exit = true,
  shell = vim.o.shell,
  float_opts = {
    border = "curved",
  },
})

function _G.set_terminal_keymaps()
  local opts = { noremap = true }
  vim.api.nvim_buf_set_keymap(0, "t", "<C-h>", [[<C-\><C-n><C-W>h]], opts)
  vim.api.nvim_buf_set_keymap(0, "t", "<C-j>", [[<C-\><C-n><C-W>j]], opts)
  vim.api.nvim_buf_set_keymap(0, "t", "<C-k>", [[<C-\><C-n><C-W>k]], opts)
  vim.api.nvim_buf_set_keymap(0, "t", "<C-l>", [[<C-\><C-n><C-W>l]], opts)
end

vim.cmd("autocmd! TermOpen term://* lua set_terminal_keymaps()")

local Terminal = require("toggleterm.terminal").Terminal
local lazygit = Terminal:new({
  cmd = "lazygit",
  hidden = false,
  direction = "float",
  float_opts = {
    width = function()
      return math.ceil(vim.o.columns * 0.95)
    end,
  },
})

-- local cargo_run = Terminal:new({
-- 	cmd = "cargo run",
-- 	close_on_exit = false,
-- 	hidden = false,
-- 	direction = "float",
-- 	float_opts = {
-- 		width = function()
-- 			return math.ceil(vim.o.columns * 0.95)
-- 		end,
-- 	},
-- })
--
-- local cargo_test = Terminal:new({
-- 	cmd = "cargo test -- --show-output",
-- 	close_on_exit = false,
-- 	hidden = false,
-- 	direction = "float",
-- 	float_opts = {
-- 		width = function()
-- 			return math.ceil(vim.o.columns * 0.95)
-- 		end,
-- 	},
-- })

function _LAZYGIT_TOGGLE()
  lazygit:toggle()
end

-- ---------------------------------
-- ----------- REMAPS --------------
-- ---------------------------------
local wk = require("which-key")

wk.add({
  { "<leader>g",  group = "Toggleterm" },
  { "<leader>go", "<cmd>lua _LAZYGIT_TOGGLE()<CR>", desc = "Lazy Git" },
})
