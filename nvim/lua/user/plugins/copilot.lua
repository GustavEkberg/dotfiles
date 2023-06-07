local utils = require("user.utils")
local copilot = utils.call_plugin("copilot")
local copilot_cmp = utils.call_plugin("copilot-cmp")

copilot.setup({
  suggestion = { enabled = false },
  panel = { enabled = false },
  -- panel = {
  --   enabled = true,
  --   auto_refresh = true,
  --   keymap = {
  --     jump_prev = "[[",
  --     jump_next = "]]",
  --     accept = "<CR>",
  --     refresh = "gr",
  --     open = "<M-CR>"
  --   },
  --   layout = {
  --     position = "bottom", -- | top | left | right
  --     ratio = 0.4
  --   },
  -- },
  -- suggestion = {
  --   enabled = true,
  --   auto_trigger = true,
  --   debounce = 75,
  --   keymap = {
  --     accept = "<C-l>",
  --     accept_word = false,
  --     accept_line = false,
  --     next = "<C-k>",
  --     prev = "<M-[>",
  --     dismiss = "<C-]>",
  --   },
  -- },
  filetypes = {
    yaml = false,
    markdown = false,
    help = false,
    gitcommit = false,
    gitrebase = false,
    hgcommit = false,
    svn = false,
    cvs = false,
    ["."] = false,
  },
  copilot_node_command = 'node', -- Node.js version must be > 16.x
  server_opts_overrides = {},
})

local wk = require("which-key")

wk.register({
  c = {
    name = "Copilot",
    e = { '<cmd>:lua require("copilot.suggestion").toggle_auto_trigger()<CR>', "Enable/Disable" },
  },
}, { prefix = "<leader>" })

require("copilot_cmp").setup()
