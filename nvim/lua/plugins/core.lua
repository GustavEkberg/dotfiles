return {
  -- Core dependencies
  { "nvim-lua/plenary.nvim" },
  { "kyazdani42/nvim-web-devicons" },
  { "MunifTanjim/nui.nvim" },

  -- Colorschemes
  {
    "uloco/bluloco.nvim",
    lazy = false,
    priority = 1000,
    dependencies = { "rktjmp/lush.nvim" },
    config = function()
      -- Set bluloco-dark as the default colorscheme
      vim.cmd("colorscheme bluloco-dark")

      -- Apply custom highlights
      vim.cmd("highlight Normal guibg=NONE ctermbg=NONE")
      vim.cmd("highlight Visual guibg=#632363 guifg=reverse")
      vim.cmd("highlight NvimTreeNormal guibg=#000000")
      vim.cmd("highlight NvimTreeNormalNC guibg=#000000")
      vim.cmd("highlight TelescopeNormal guibg=#000000")
      vim.cmd("highlight TroubleNormal guibg=#000000")
      vim.cmd("highlight TelescopeBorder guibg=#000000")

      vim.api.nvim_set_hl(0, 'SpellBad', { fg = "#FF0000", undercurl = true })
    end,
  },
  { "folke/tokyonight.nvim" },
  { "navarasu/onedark.nvim" },
  { "bluz71/vim-moonfly-colors" },
  { "preservim/vim-colors-pencil" },
  { "rktjmp/lush.nvim" },

  -- UI Enhancements
  {
    "folke/which-key.nvim",
    event = "VeryLazy",
    config = function()
      require("which-key").setup()
    end,
  },

  {
    "nvim-lualine/lualine.nvim",
    event = "VeryLazy",
    dependencies = {
      "nvim-tree/nvim-web-devicons"
    },
    config = function()
      -- Function to get relative path from project root
      local function relative_path()
        local path = vim.fn.expand('%:p')
        local cwd = vim.fn.getcwd()

        -- If the file is not in the current working directory, show the full path
        if path:find(cwd, 1, true) ~= 1 then
          return vim.fn.expand('%:p')
        end

        -- Get the relative path from the project root
        local relative = path:sub(#cwd + 2)

        -- If the path is empty, return the filename
        if relative == "" then
          return vim.fn.expand('%:t')
        end

        return relative
      end

      require("lualine").setup({
        options = {
          icons_enabled = true,
          theme = 'auto',
          component_separators = { left = '', right = ''},
          section_separators = { left = '', right = ''},
          disabled_filetypes = {
            statusline = {},
            winbar = {},
          },
          ignore_focus = {},
          always_divide_middle = true,
          globalstatus = true,
          refresh = {
            statusline = 1000,
            tabline = 1000,
            winbar = 1000,
          }
        },
        sections = {
          lualine_a = {'mode'},
          lualine_b = {'branch', 'diff', 'diagnostics'},
          lualine_c = {
            {
              relative_path,
              path = 1, -- Show relative path
              color = { fg = "#ffffff", gui = "bold" }
            }
          },
          lualine_x = {'encoding', 'fileformat', 'filetype'},
          lualine_y = {'progress'},
          lualine_z = {'location'}
        },
        inactive_sections = {
          lualine_a = {},
          lualine_b = {},
          lualine_c = {'filename'},
          lualine_x = {'location'},
          lualine_y = {},
          lualine_z = {}
        },
        tabline = {},
        winbar = {},
        inactive_winbar = {},
        extensions = {}
      })
    end,
  },

  {
    "akinsho/toggleterm.nvim",
    config = function()
      require("toggleterm").setup()
    end,
  },

  {
    "rcarriga/nvim-notify",
    config = function()
      require("notify").setup()
    end,
  },

  {
    "folke/noice.nvim",
    dependencies = {
      "MunifTanjim/nui.nvim",
      "rcarriga/nvim-notify",
    },
    config = function()
      require("noice").setup()
    end,
  },

  {
    "stevearc/dressing.nvim",
    config = function()
      require("dressing").setup()
    end,
  },

  {
    "lukas-reineke/indent-blankline.nvim",
    main = "ibl",
    config = function()
      require("ibl").setup()
    end,
  },

  -- Navigation and Editing
  {
    "nvim-neo-tree/neo-tree.nvim",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "kyazdani42/nvim-web-devicons",
      "MunifTanjim/nui.nvim",
    },
    config = function()
      require("neo-tree").setup()
    end,
  },

  {
    "ThePrimeagen/harpoon",
    branch = "harpoon2",
    dependencies = { "nvim-lua/plenary.nvim" },
    config = function()
      local harpoon = require("harpoon")

      harpoon:setup({
        settings = {
          save_on_toggle = true,
          sync_on_ui_close = true,
        },
      })

      -- Set up keymaps
      vim.keymap.set("n", "<S-F1>", function() harpoon:list():select(1) end, { noremap = true, silent = true })
      vim.keymap.set("n", "<S-F2>", function() harpoon:list():select(2) end, { noremap = true, silent = true })
      vim.keymap.set("n", "<S-F3>", function() harpoon:list():select(3) end, { noremap = true, silent = true })
      vim.keymap.set("n", "<S-F4>", function() harpoon:list():select(4) end, { noremap = true, silent = true })
      vim.keymap.set("n", "<S-F5>", function() harpoon:list():select(5) end, { noremap = true, silent = true })
      vim.keymap.set("n", "<S-F6>", function() harpoon:list():select(6) end, { noremap = true, silent = true })
      vim.keymap.set("n", "<S-F7>", function() harpoon:list():select(7) end, { noremap = true, silent = true })
      vim.keymap.set("n", "<S-F8>", function() harpoon:list():select(8) end, { noremap = true, silent = true })
      vim.keymap.set("n", "<S-F9>", function() harpoon:list():select(9) end, { noremap = true, silent = true })

      -- Set up which-key integration
      local wk = require("which-key")
      wk.add({
        { "<leader>b", group = "Harpoon" },
        { "<leader>ba", function() harpoon:list():add() end, desc = "Add file to Harpoon" },
        { "<leader>bs", function() harpoon:list():next() end, desc = "Navigate to next file" },
        { "<leader>bb", function() harpoon.ui:toggle_quick_menu(harpoon:list()) end, desc = "Toggle menu" },
      })
    end,
  },

  {
    "windwp/nvim-autopairs",
    event = "InsertEnter",
    config = function()
      require("nvim-autopairs").setup()
    end,
  },

  {
    "numToStr/Comment.nvim",
    config = function()
      require("Comment").setup()
    end,
  },

  {
    "tpope/vim-surround",
  },

  {
    "ggandor/leap.nvim",
    config = function()
      require("leap").add_default_mappings()
    end,
  },

  {
    "folke/zen-mode.nvim",
    config = function()
      require("zen-mode").setup()
    end,
  },

  {
    "rmagatti/goto-preview",
    config = function()
      require("goto-preview").setup()
    end,
  },

  -- Git
  {
    "lewis6991/gitsigns.nvim",
    config = function()
      require("gitsigns").setup()
    end,
  },

  {
    "kdheepak/lazygit.nvim",
    dependencies = {
      "nvim-lua/plenary.nvim",
    },
  },

  -- Augment
  {
    "augmentcode/augment.vim",
  },

  -- Dashboard
  {
    "glepnir/dashboard-nvim",
    event = "VimEnter",
    dependencies = {
      "nvim-tree/nvim-web-devicons",
      "akinsho/toggleterm.nvim",
    },
    config = function()
      -- Define the pwd function
      local function pwd()
        return vim.api.nvim_command_output("!basename $PWD"):gsub("[\r,\n]",""):gsub(":!basename $PWD","")
      end

      -- Dashboard configuration

      -- Configure dashboard
      require("dashboard").setup({
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
              icon = " ",
              desc = "Search files",
              key = "f",
              action = ":Telescope find_files",
            },
            {
              icon = " ",
              desc = "Search file content",
              key = "d",
              action = ":Telescope live_grep",
            },
            {
              icon = "★ ",
              desc = "Lazygit",
              key = "g",
              action = ":lua _G._LAZYGIT_TOGGLE()",
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
    end,
  },
}
