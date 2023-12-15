local utils = require("user.utils")
local startup = utils.call_plugin("dashboard")

function pwd() 
  return vim.api.nvim_command_output("!basename $PWD"):gsub("[\r,\n]",""):gsub(":!basename $PWD","")
end

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

function _LAZYGIT_TOGGLE()
  lazygit:toggle()
end

startup.setup({
  theme = "doom",
  disable_move = true,
  config = {
    header = {
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "  ▄▄▄       ▄▄▄▄    ██▀███   ▄▄▄      ▒██   ██▒ ▄▄▄        ██████ ",
        " ▒████▄    ▓█████▄ ▓██ ▒ ██▒▒████▄    ▒▒ █ █ ▒░▒████▄    ▒██    ▒ ",
        " ▒██  ▀█▄  ▒██▒ ▄██▓██ ░▄█ ▒▒██  ▀█▄  ░░  █   ░▒██  ▀█▄  ░ ▓██▄   ",
        " ░██▄▄▄▄██ ▒██░█▀  ▒██▀▀█▄  ░██▄▄▄▄██  ░ █ █ ▒ ░██▄▄▄▄██   ▒   ██▒",
        "  ▓█   ▓██▒░▓█  ▀█▓░██▓ ▒██▒ ▓█   ▓██▒▒██▒ ▒██▒ ▓█   ▓██▒▒██████▒▒",
        "  ▒▒   ▓▒█░░▒▓███▀▒░ ▒▓ ░▒▓░ ▒▒   ▓▒█░▒▒ ░ ░▓ ░ ▒▒   ▓▒█░▒ ▒▓▒ ▒ ░",
        "   ▒   ▒▒ ░▒░▒   ░   ░▒ ░ ▒░  ▒   ▒▒ ░░░   ░▒ ░  ▒   ▒▒ ░░ ░▒  ░ ░",
        "   ░   ▒    ░    ░   ░░   ░   ░   ▒    ░    ░    ░   ▒   ░  ░  ░  ",
        "       ░  ░ ░         ░           ░  ░ ░    ░        ░  ░      ░  ",
        "                 ░                                                ",
        "",
        "",
        "",
        "",
        pwd(),
        "",
        "",
        "",
        "",
      },
      center = {
      {
        icon = " ",
        desc = "Search files",
        key = "f",
        action = ":Telescope find_files",
      },
      {
	      icon = " ",
        desc = "Search file content",
        key = "d",
        action = ":Telescope live_grep",
      },
      {
	      icon = "★ ",
        desc = "Lazygit",
        key = "g",
        action = ":lua _LAZYGIT_TOGGLE()",
      },
      {
        icon = "✕ ",
        desc = "Quit",
        key = "q",
        action = ":q!"
      },
    },
  }
})
