local wk = require("which-key")

local utils = require("user.utils")
local telescope = utils.call_plugin("telescope")

local actions = require("telescope.actions")

telescope.setup({
	defaults = {

		prompt_prefix = " ",
		selection_caret = " ",
		path_display = { "smart" },
		file_ignore_patterns = {
			".DS_Store",
			".git/",
			"cdk.out/",
      ".aws-sam/",

			-- TS
			".next/",
			"%.lock",
      "index.d.ts",
			"node_modules/",
			"%.tsbuildinfo",
			"npm-debug.log",
			"yarn-debug.log",
			"yarn-error.log",

			-- Media
			"%.jpg",
			"%.jpgeg",
			"%.png",
			"%.gif",
			"%.webp",
			"%.mp4",
			"%.svg",
			"%.pdf",

			-- Fonts
			"%.woff",
			"%.woff2",
			"%.otf",
			"%.ttf",

			-- Rust
			"target/",
		},

		mappings = {
			i = {
				["<Down>"] = actions.cycle_history_next,
				["<Up>"] = actions.cycle_history_prev,
				["<C-j>"] = actions.move_selection_next,
				["<C-k>"] = actions.move_selection_previous,
			},

			n = {
				["q"] = actions.close,
			},
		},
	},
  extensions = {
    fzf = {
      hidden = true,                   -- show hidden files
      fuzzy = true,                    -- false will only do exact matching
      override_generic_sorter = true,  -- override the generic sorter
      override_file_sorter = true,     -- override the file sorter
      case_mode = "ignore_case",        -- or "ignore_case" or "respect_case"
    }
  }
})

telescope.load_extension("file_browser")
telescope.load_extension("fzf")
telescope.load_extension('harpoon')
telescope.load_extension('notify')


-- ---------------------------------
-- ----------- REMAPS --------------
-- ---------------------------------
wk.register({
	f = {
		name = "Telescope", -- group name
    f = { function() require('telescope.builtin').find_files({hidden = true}) end, "Search files" },
		d = { ":Telescope keymaps<CR>", "Search keymaps" },
		c = { ":Telescope live_grep<CR>", "Search files contents" },
		b = { ":Telescope buffers<CR>", "Search Buffers" },
		p = { ":Telescope projects<CR>", "Search Projects" },
	},
}, { prefix = "<leader>" })
