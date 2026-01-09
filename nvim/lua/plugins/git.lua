return {
  {
    "lewis6991/gitsigns.nvim",
    config = function()
      require('gitsigns').setup({
        on_attach = function(bufnr)
          local gs = package.loaded.gitsigns

          local function map(mode, l, r, opts)
            opts = opts or {}
            opts.buffer = bufnr
            vim.keymap.set(mode, l, r, opts)
          end

          -- Navigation
          map('n', ']c', function()
            if vim.wo.diff then return ']c' end
            vim.schedule(function() gs.next_hunk() end)
            return '<Ignore>'
          end, { expr = true })

          map('n', '[c', function()
            if vim.wo.diff then return '[c' end
            vim.schedule(function() gs.prev_hunk() end)
            return '<Ignore>'
          end, { expr = true })

          -- Text object
          map({ 'o', 'x' }, 'ih', ':<C-U>Gitsigns select_hunk<CR>')
        end
      })

      -- Set up which-key integration for git signs
      local ok, wk = pcall(require, "which-key")
      if ok then
        wk.add({
          { "<leader>gg",   group = "Gitsigns" },
          { "<leader>ggf",  ":Gitsigns blame<CR>",                     desc = "Blame file" },
          { "<leader>ggb",  ":Gitsigns blame_line<CR>",                desc = "Blame line" },
          { "<leader>ggd",  ":Gitsigns diffthis<CR>",                  desc = "Diff current file" },
          { "<leader>ggs",  ":Gitsigns stage_hunk<CR>",                desc = "Stage hunk" },
          { "<leader>ggS",  ":Gitsigns stage_buffer<CR>",              desc = "Stage buffer" },
          { "<leader>ggr",  ":Gitsigns reset_hunk<CR>",                desc = "Reset hunk" },
          { "<leader>ggu",  ":Gitsigns undo_stage_hunk<CR>",           desc = "Undo stage hunk" },
          { "<leader>ggR",  ":Gitsigns reset_buffer<CR>",              desc = "Reset buffer" },
          { "<leader>ggp",  ":Gitsigns preview_hunk<CR>",              desc = "Preview hunk" },
          { "<leader>ggtb", ":Gitsigns toggle_current_line_blame<CR>", desc = "Toggle blame" },
          { "<leader>ggD",  ":Gitsigns diffthis ~<CR>",                desc = "Diff this ~" },
          { "<leader>ggtd", ":Gitsigns toggle_deleted<CR>",            desc = "Toggle deleted" },
        })
      end
    end,
  },
  {
    "sindrets/diffview.nvim",
  },
  {
    "NeogitOrg/neogit",
    dependencies = { "nvim-lua/plenary.nvim" },
    config = function()
      require('neogit').setup({
        kind = "floating",
        integrations = {
          diffview = true,
        },
      })

      -- Set up which-key integration for Neogit and diffview
      local ok, wk = pcall(require, "which-key")
      if ok then
        wk.add({
          { "<leader>g",  group = "Git" },
          { "<leader>go", ":Neogit<CR>",                desc = "Open Neogit" },
          { "<leader>gl", ":Neogit kind=log<CR>",       desc = "Git log" },
          { "<leader>gb", ":Neogit kind=branching<CR>", desc = "Branches" },
          { "<leader>gc", ":Neogit kind=commit<CR>",    desc = "Commit" },
          { "<leader>gs", ":Neogit kind=stash<CR>",     desc = "Stash" },
          { "<leader>gv", ":DiffviewOpen<CR>",          desc = "Toggle diffview" },
          { "<leader>gh", ":DiffviewFileHistory<CR>",   desc = "File history" },
        })
      end
    end,
  },
}
