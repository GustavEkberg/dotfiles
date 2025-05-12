local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable", -- latest stable release
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

-- Load lazy
require("lazy").setup({
  spec = {
    -- Import all your plugin specifications from the 'plugins' directory
    { import = "plugins" },
  },
  defaults = {
    lazy = false, -- By default, load plugins on startup
    version = false, -- Try to use the latest git commit
  },
  install = { colorscheme = { "bluloco-dark" } },
  checker = { enabled = true }, -- Automatically check for plugin updates
  performance = {
    rtp = {
      -- Disable some built-in plugins to improve performance
      disabled_plugins = {
        "gzip",
        "tarPlugin",
        "tohtml",
        "tutor",
        "zipPlugin",
      },
    },
  },
  ui = {
    border = "rounded",
  },
})
