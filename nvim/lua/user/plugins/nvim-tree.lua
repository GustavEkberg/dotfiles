local utils = require("user.utils")
local nvim_tree = utils.call_plugin("nvim-tree")
local nvim_tree_config = utils.call_plugin("nvim-tree.config")

local tree_cb = nvim_tree_config.nvim_tree_callback

nvim_tree.setup({
	filters = {
		dotfiles = false, -- display dotfiles by default. Can be toggled with H
		custom = { -- always hide these files
			"./target/*",
			".DS_Store",
		},
		exclude = { -- always show these files
			".env",
			".env.local",
		},
	},
	git = {
		ignore = false, -- show listed files in .gitignore by default. Can be toggled with I
	},
	update_focused_file = {
		enable = true,
		update_cwd = true,
	},
	renderer = {
		root_folder_modifier = ":t",
		icons = {
			glyphs = {
				default = "",
				symlink = "",
				folder = {
					arrow_open = "",
					arrow_closed = "",
					default = "",
					open = "",
					empty = "",
					empty_open = "",
					symlink = "",
					symlink_open = "",
				},
				git = {
					unstaged = "",
					staged = "S",
					unmerged = "",
					renamed = "➜",
					untracked = "U",
					deleted = "",
					ignored = "◌",
				},
			},
		},
	},
	diagnostics = {
		enable = true,
		show_on_dirs = true,
		icons = {
			hint = "",
			info = "",
			warning = "",
			error = "",
		},
	},
	view = {
		adaptive_size = true,
		side = "left",
		mappings = {
			list = {
				{ key = { "l", "<CR>", "o" }, cb = tree_cb("edit") },
				{ key = "h", cb = tree_cb("close_node") },
				{ key = "v", cb = tree_cb("vsplit") },
			},
		},
	},
})

-- Automatically open file on creation
-- https://github.com/nvim-tree/nvim-tree.lua/issues/1120
local api_status_ok, api = pcall(require, "nvim-tree.api")
if not api_status_ok then
	return
end

api.events.subscribe(api.events.Event.FileCreated, function(file)
	vim.cmd("edit " .. file.fname)
end)

-- ---------------------------------
-- ----------- REMAPS --------------
-- ---------------------------------
local wk = utils.call_plugin("which-key")

wk.register({
	e = { ":NvimTreeToggle<CR>", "Toggle nvim tree" },
}, { prefix = "<leader>" })
