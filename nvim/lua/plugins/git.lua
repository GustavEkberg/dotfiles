return {
  {
    "lewis6991/gitsigns.nvim",
    config = function()
      require('gitsigns').setup()
    end,
  },
  {
    "NeogitOrg/neogit",
    dependencies = { "nvim-lua/plenary.nvim" },
    config = function()
      require('neogit').setup()

      -- Set up which-key integration
      local ok, wk = pcall(require, "which-key")
      if ok then
        wk.add({
          { "<leader>go", ":Neogit<CR>", desc = "Open Neogit" },
        })
      end
    end,
  },
}