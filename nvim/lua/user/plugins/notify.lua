local utils = require("user.utils")
local notify = utils.call_plugin("notify")

notify.setup({
    background_colour = "#000000",
    fps = 30,
    icons = {
      DEBUG = "",
      ERROR = "",
      INFO = "",
      TRACE = "✎",
      WARN = ""
    },
    level = 2,
    minimum_width = 50,
    render = "compact",
    stages = "fade",
    time_formats = {
      notification = "%T",
      notification_history = "%FT%T"
    },
    timeout = 1000,
    top_down = true
})
vim.cmd("highlight NotifyERRORBorder guifg=#ff2e3f guibg=#000000")
vim.cmd("highlight NotifyWARNBorder guifg=#da7b44 guibg=#000000")
vim.cmd("highlight NotifyINFOBorder guifg=#3892ff guibg=#000000")
vim.cmd("highlight NotifyDEBUGBorder guifg=#7c84da guibg=#000000")
vim.cmd("highlight NotifyTRACEBorder guifg=#ce9888 guibg=#000000")

