return {
  {
    "nvim-telescope/telescope.nvim",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "nvim-telescope/telescope-file-browser.nvim",
      { "nvim-telescope/telescope-fzf-native.nvim", build = "make" },
    },
    config = function()
      local telescope = require("telescope")
      local actions = require("telescope.actions")
      local telescope_utils = require("user.telescope_utils")

      telescope.setup({
        defaults = {
          prompt_prefix = " ",
          selection_caret = " ",
          path_display = { "smart" },

          -- Performance optimizations
          vimgrep_arguments = {
            "rg",
            "--color=never",
            "--no-heading",
            "--with-filename",
            "--line-number",
            "--column",
            "--smart-case",
            "--hidden",
          },

          -- Use faster sorter
          file_sorter = require("telescope.sorters").get_fzy_sorter,
          generic_sorter = require("telescope.sorters").get_fzy_sorter,

          -- Faster previewer
          previewers = {
            -- Use less resources for previews
            file_previewer = require("telescope.previewers").vim_buffer_cat.new,
            grep_previewer = require("telescope.previewers").vim_buffer_vimgrep.new,
            qflist_previewer = require("telescope.previewers").vim_buffer_qflist.new,
          },

          -- Cache results for faster reopening
          cache_picker = {
            num_pickers = 5,
            limit_entries = 300,
          },

          -- Disable preview for faster results
          preview = {
            timeout = 200, -- ms
            filesize_limit = 1, -- MB
            treesitter = false, -- Disable treesitter for previews (faster)
          },

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

            -- Additional ignores for performance
            "%.min.js",
            "%.min.css",
            "%.map",
            "dist/",
            "build/",
            "vendor/",
          },

          mappings = {
            i = {
              ["<Down>"] = actions.cycle_history_next,
              ["<Up>"] = actions.cycle_history_prev,
              ["<C-j>"] = actions.move_selection_next,
              ["<C-k>"] = actions.move_selection_previous,
              ["<C-p>"] = telescope_utils.toggle_telescope_preview(),
              ["<C-s>"] = actions.select_horizontal, -- Open in horizontal split
              ["<C-v>"] = actions.select_vertical,   -- Open in vertical split
              ["<C-t>"] = actions.select_tab,        -- Open in new tab
              ["<C-c>"] = actions.close,             -- Close with Ctrl+c
              ["<C-u>"] = false,                     -- Clear defaults that might slow things down
              ["<C-d>"] = false,                     -- Clear defaults that might slow things down
            },

            n = {
              ["q"] = actions.close,
              ["<C-p>"] = telescope_utils.toggle_telescope_preview(),
            },
          },
        },

        -- Configure pickers for better performance
        pickers = {
          find_files = {
            find_command = { "fd", "--type", "f", "--strip-cwd-prefix" },
            hidden = true,
          },
          live_grep = {
            additional_args = function()
              return { "--hidden" }
            end,
          },
          buffers = {
            sort_lastused = true,
            sort_mru = true,
            previewer = false, -- Faster buffer switching without preview
          },
        },

        extensions = {
          fzf = {
            fuzzy = true,                   -- Enable fuzzy search
            override_generic_sorter = true, -- Override the generic sorter
            override_file_sorter = true,    -- Override the file sorter
            case_mode = "smart_case",       -- or "ignore_case" or "respect_case"
            -- The below options improve fuzzy search performance
            fzf_opts = {
              -- options passed to the fzf executable
              ['--exact'] = false,          -- Exact matching off for fuzzy search
              ['--no-sort'] = false,        -- Let fzf do the sorting (faster)
              ['--tiebreak'] = 'score',     -- Sort by score when tied
              ['--ansi'] = true,            -- Support ANSI color codes
              ['--height'] = '100%',        -- Use full height
              ['--bind'] = 'ctrl-d:half-page-down,ctrl-u:half-page-up', -- Add keybindings
            },
          },
        },
      })

      telescope.load_extension("file_browser")
      telescope.load_extension("fzf")
      telescope.load_extension("harpoon")
      telescope.load_extension("notify")

      -- Setup keymaps with optimized functions
      local wk = require("which-key")
      wk.add({
        { "<leader>f", group = "Telescope" },
        { "<leader>fb", ":Telescope buffers<CR>", desc = "Search Buffers" },
        {
          "<leader>fc",
          function() telescope_utils.smart_live_grep() end,
          desc = "Search files contents (smart)"
        },
        {
          "<leader>fv",
          function() telescope_utils.fuzzy_live_grep() end,
          desc = "Fuzzy search file contents"
        },
        { "<leader>fd", ":Telescope keymaps<CR>", desc = "Search keymaps" },
        {
          "<leader>ff",
          function() telescope_utils.smart_find_files() end,
          desc = "Search files (smart)"
        },
        {
          "<leader>fz",
          function() telescope_utils.fuzzy_find_files() end,
          desc = "Fuzzy find files (fast)"
        },
        {
          "<leader>fg",
          function() telescope_utils.fast_grep_string() end,
          desc = "Search word under cursor"
        },
        { "<leader>fp", ":Telescope projects<CR>", desc = "Search Projects" },
        {
          "<leader>fF",
          function() telescope_utils.find_files_no_preview() end,
          desc = "Search files (no preview, faster)"
        },
        {
          "<leader>fC",
          function() telescope_utils.live_grep_no_preview() end,
          desc = "Search files contents (no preview, faster)"
        },
      })
    end,
  },

  {
    "nvim-telescope/telescope-file-browser.nvim",
    dependencies = {
      "nvim-telescope/telescope.nvim",
      "nvim-lua/plenary.nvim",
    },
  },

  {
    "nvim-telescope/telescope-fzf-native.nvim",
    build = "make",
  },
}
