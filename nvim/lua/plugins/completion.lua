return {
  -- Completion
  {
    "hrsh7th/nvim-cmp",
    dependencies = {
      "hrsh7th/cmp-buffer",
      "hrsh7th/cmp-path",
      "hrsh7th/cmp-nvim-lsp",
      "hrsh7th/cmp-nvim-lua",
    },
    config = function()
      local cmp = require("cmp")
      local cmp_utils = require("user.cmp_utils")

      -- Set up large file detection and commands
      cmp_utils.setup_large_file_detection()
      cmp_utils.setup_commands()

      cmp.setup({
        performance = {
          debounce = 60, -- Debounce completion menu (in ms)
          throttle = 30, -- Throttle completion menu rendering
          fetching_timeout = 200, -- Timeout for fetching completion items
          async_budget = 1, -- ms per rendering cycle (lower = smoother but more CPU)
          max_view_entries = 200, -- Maximum completion items to show in the menu
        },

        preselect = cmp.PreselectMode.None, -- Don't preselect items

        mapping = cmp.mapping.preset.insert({
          ["<C-k>"] = cmp.mapping.select_prev_item(),
          ["<C-j>"] = cmp.mapping.select_next_item(),
          ["<C-b>"] = cmp.mapping.scroll_docs(-4),
          ["<C-f>"] = cmp.mapping.scroll_docs(4),
          ["<C-Space>"] = cmp.mapping.complete(),
          ["<C-e>"] = cmp.mapping.abort(),
          ["<CR>"] = cmp.mapping.confirm({ select = true }),
        }),

        -- Window appearance
        window = {
          completion = cmp.config.window.bordered({
            winhighlight = "Normal:Normal,FloatBorder:FloatBorder,CursorLine:Visual,Search:None",
          }),
          documentation = cmp.config.window.bordered({
            winhighlight = "Normal:Normal,FloatBorder:FloatBorder,CursorLine:Visual,Search:None",
          }),
        },

        -- Optimize sources with priorities and limits
        sources = cmp.config.sources({
          {
            name = "nvim_lsp",
            priority = 1000,
            max_item_count = 20,
            entry_filter = function(entry)
              return require("cmp.types").lsp.CompletionItemKind[entry:get_kind()] ~= "Text"
            end
          },
          {
            name = "nvim_lua",
            priority = 900,
            max_item_count = 10
          },
          {
            name = "buffer",
            priority = 500,
            max_item_count = 5,
            keyword_length = 3, -- Min chars before triggering
            option = {
              get_bufnrs = function()
                -- Only show completions from current buffer
                return { vim.api.nvim_get_current_buf() }
              end,
            },
          },
          {
            name = "path",
            priority = 250,
            max_item_count = 5
          },
        }),

        -- Improve sorting
        sorting = {
          priority_weight = 2.0,
          comparators = {
            cmp.config.compare.exact,
            cmp.config.compare.score,
            cmp.config.compare.recently_used,
            cmp.config.compare.locality,
            cmp.config.compare.kind,
            cmp.config.compare.sort_text,
            cmp.config.compare.length,
            cmp.config.compare.order,
          },
        },

        -- Formatting
        formatting = {
          fields = { "abbr", "kind", "menu" },
          format = function(entry, vim_item)
            vim_item.menu = ({
              nvim_lsp = "[LSP]",
              nvim_lua = "[Lua]",
              buffer = "[Buf]",
              path = "[Path]",
            })[entry.source.name]
            return vim_item
          end,
        },
      })

      -- Add filetype-specific configurations
      cmp.setup.filetype('sql', {
        sources = {
          { name = 'buffer', max_item_count = 3, keyword_length = 4 },
        },
        performance = {
          debounce = 150,
          throttle = 50,
        }
      })
    end,
  },

  {
    "hrsh7th/cmp-buffer",
  },

  {
    "hrsh7th/cmp-path",
  },

  {
    "hrsh7th/cmp-nvim-lsp",
  },

  {
    "hrsh7th/cmp-nvim-lua",
  },

}
