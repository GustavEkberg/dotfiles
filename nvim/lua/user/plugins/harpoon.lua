local utils = require("user.utils")
local harpoon = utils.call_plugin("harpoon")
harpoon.setup({
    -- sets the marks upon calling `toggle` on the ui, instead of require `:w`.
    save_on_toggle = false,

    -- saves the harpoon file upon every change. disabling is unrecommended.
    save_on_change = true,

    -- sets harpoon to run the command immediately as it's passed to the terminal when calling `sendCommand`.
    enter_on_sendcmd = false,

    -- closes any tmux windows harpoon that harpoon creates when you close Neovim.
    tmux_autoclose_windows = false,

    -- filetypes that you want to prevent from adding to the harpoon list menu.
    excluded_filetypes = { "harpoon" },

    -- set marks specific to each git branch inside git repository
    mark_branch = false,

    -- enable tabline with harpoon marks
    tabline = false,
    tabline_prefix = "   ",
    tabline_suffix = "   ",
})

local wk = utils.call_plugin("which-key")
wk.register({
  b = {
    name = "Harpoon",
    a = { "<cmd>lua require('harpoon.mark').add_file()<CR>", "Add file to Harpoon" },
    b = { "<cmd>lua require('harpoon.ui').nav_next()<CR>", "Navigate to next file" },
    s = { "<cmd>lua require('harpoon.ui').toggle_quick_menu()<CR>", "Toggle menu" },
    d = { "<cmd>Telescope harpoon marks<CR>", "Toggle Telescope menu" },
  }
}, { prefix = "<leader>" })

