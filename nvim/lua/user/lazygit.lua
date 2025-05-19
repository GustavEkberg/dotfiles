-- LazyGit configuration for Neovim
local M = {}

-- Setup LazyGit to use Neovim as the editor
function M.setup()
  -- Set environment variables for LazyGit
  vim.env.GIT_EDITOR = "nvr -cc split --remote-wait +'set bufhidden=wipe'"

  -- Configure lazygit.nvim plugin
  vim.g.lazygit_floating_window_winblend = 0       -- Transparency of floating window
  vim.g.lazygit_floating_window_scaling_factor = 0.9 -- Scaling factor for floating window
  vim.g.lazygit_floating_window_border_chars = {'╭', '─', '╮', '│', '╯', '─', '╰', '│'} -- Border chars
  vim.g.lazygit_use_neovim_remote = 1             -- Use neovim-remote for opening files

  -- Create autocommands for LazyGit buffer
  local lazygit_augroup = vim.api.nvim_create_augroup("LazyGit", { clear = true })

  -- Set up autocommand to handle LazyGit buffer
  vim.api.nvim_create_autocmd("FileType", {
    group = lazygit_augroup,
    pattern = "lazygit",
    callback = function()
      -- Set buffer options for LazyGit
      vim.opt_local.number = false
      vim.opt_local.relativenumber = false
      vim.opt_local.signcolumn = "no"
      vim.opt_local.cursorline = false
    end,
  })

  -- Set up autocommand for terminal buffers
  vim.api.nvim_create_autocmd("TermOpen", {
    group = lazygit_augroup,
    pattern = "*lazygit*",
    callback = function()
      -- Set terminal buffer options
      vim.opt_local.number = false
      vim.opt_local.relativenumber = false
      vim.opt_local.signcolumn = "no"
      vim.opt_local.cursorline = false
    end,
  })

  -- Set up lazygit terminal
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

  -- Define the toggle function
  _G._LAZYGIT_TOGGLE = function()
    lazygit:toggle()
  end

  -- Set up keybindings
  local keymap = vim.keymap.set
  keymap('n', '<C-s>', '<cmd>lua _G._LAZYGIT_TOGGLE()<CR>', { noremap = true, silent = true })
  keymap('t', '<C-s>', '<cmd>lua _G._LAZYGIT_TOGGLE()<CR>', { noremap = true, silent = true })

  -- Set up which-key integration
  local ok, wk = pcall(require, "which-key")
  if ok then
    wk.add({
      { "<leader>go", "<cmd>lua _G._LAZYGIT_TOGGLE()<CR>", desc = "Open LazyGit" },
    })
  end
end

return M
