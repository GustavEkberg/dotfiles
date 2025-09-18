local servers = {
  "pyright",
  "html",
  "tailwindcss",
  "prismals",
  "lua_ls",
  "bashls",
  "jsonls",
  "eslint",
  "yamlls",
}

local settings = {
  ui = {
    border = "none",
    icons = {
      package_installed = "◍",
      package_pending = "◍",
      package_uninstalled = "◍",
    },
  },
  log_level = vim.log.levels.INFO,
  max_concurrent_installers = 4,
}

local status_ok, mason = pcall(require, "mason")
if not status_ok then
  return
end

-- Setup Mason with the settings
mason.setup(settings)

-- Setup Mason-lspconfig
require("mason-lspconfig").setup({
  ensure_installed = servers,
  -- Disable automatic_enable since we're not on Neovim 0.11 yet
  automatic_enable = false
})

-- Configure LSP servers using vim.lsp.config
local opts = {}

for _, server in pairs(servers) do
  opts = {
    on_attach = require("user.lsp.handlers").on_attach,
    capabilities = require("user.lsp.handlers").capabilities,
  }

  server = vim.split(server, "@", {})[1]

  local require_ok, conf_opts = pcall(require, "user.lsp.servers." .. server)
  if require_ok then
    opts = vim.tbl_deep_extend("force", conf_opts, opts)
  end

  -- Use vim.lsp.config instead of lspconfig
  vim.lsp.config[server] = opts
end
