local utils = require("user.utils").call_plugin
local configs = utils("nvim-treesitter.configs")

configs.setup({
	ensure_installed = "all", -- one of "all" or a list of languages
	highlight = {
		enable = true,
		additional_vim_regex_highlighting = true,
	},
	indent = { enable = true },
})
