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
      
      telescope.setup({
        defaults = {
          prompt_prefix = " ",
          selection_caret = " ",
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
      })
      
      telescope.load_extension("file_browser")
      telescope.load_extension("fzf")
      telescope.load_extension("harpoon")
      telescope.load_extension("notify")
      
      -- Setup keymaps
      local wk = require("which-key")
      wk.add({
        { "<leader>f", group = "Telescope" },
        { "<leader>fb", ":Telescope buffers<CR>", desc = "Search Buffers" },
        { "<leader>fc", ":Telescope live_grep<CR>", desc = "Search files contents" },
        { "<leader>fd", ":Telescope keymaps<CR>", desc = "Search keymaps" },
        {
          "<leader>ff",
          function() require('telescope.builtin').find_files({ hidden = true }) end,
          desc = "Search files"
        },
        { "<leader>fp", ":Telescope projects<CR>", desc = "Search Projects" },
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
