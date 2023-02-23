local utils = require("user.utils")

local lualine = utils.call_plugin("lualine")

lualine.setup({
	options = {
		icons_enabled = true,
		theme = "ayu_dark",
		component_separators = { left = "", right = "" },
		section_separators = { left = "", right = "" },
		disabled_filetypes = {
			statusline = {},
			winbar = {},
		},
		ignore_focus = {},
		always_divide_middle = true,
		globalstatus = true,
		refresh = {
			statusline = 1000,
			tabline = 100000,
			winbar = 100000,
		},
	},
	sections = {
		lualine_a = { "mode" },
		lualine_b = { "branch", "diff" },
		lualine_c = { "diagnostics", {
			"filename",
			file_status = true,
			path = 3,
        color = { fg = "#8583ab" },
		} },
		lualine_x = { "encoding", "fileformat", "filetype" },
		lualine_y = {},
		lualine_z = {},
	},

	inactive_sections = {
		lualine_a = {},
		lualine_b = {},
		lualine_c = {},
		lualine_x = {},
		lualine_y = {},
		lualine_z = {},
	},
	tabline = {},
	winbar = {},
	inactive_winbar = {},
	extensions = { "toggleterm", "nvim-tree" },
})
