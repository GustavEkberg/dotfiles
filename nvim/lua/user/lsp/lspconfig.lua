local lspconfig = require('lspconfig')
local wk = require('which-key')
lspconfig.pyright.setup {
  settings = {
    python = {
      analysis = {
        typeCheckingMode = "off"
      }
    }
  }
}
lspconfig.rust_analyzer.setup {
  -- Server-specific settings. See `:help lspconfig-setup`
  settings = {
    ['rust-analyzer'] = {
      check = {
        command = "clippy",
      },
      diagnostics = {
        enable = true,
      }
    },
  },
}
lspconfig.eslint.setup({
  on_attach = function(client, bufnr)
    wk.add({
      { "<leader>af", "<cmd>EslintFixAll<cr>", desc = "Format code with eslint" },
    })
  end,
})


-- Use LspAttach autocommand to only map the following keys
-- after the language server attaches to the current buffer
vim.api.nvim_create_autocmd('LspAttach', {
  group = vim.api.nvim_create_augroup('UserLspConfig', {}),
  callback = function(ev)
    -- Enable completion triggered by <c-x><c-o>
    vim.bo[ev.buf].omnifunc = 'v:lua.vim.lsp.omnifunc'
  end,
})

vim.api.nvim_create_autocmd("BufWritePre", {
  group = vim.api.nvim_create_augroup('UserLspConfig', {}),
  callback = function()
    -- Get the current buffer's name (file path)
    local bufname = vim.api.nvim_buf_get_name(0)
    -- Check if the file ends in .js, and return early if so
    if bufname:match("%.(js|jsx|ts|tsx)$") then
      return
    end

    vim.lsp.buf.format { async = true }
  end,
})

vim.api.nvim_create_autocmd("BufWritePre", {
  group = vim.api.nvim_create_augroup('UserLspConfig', {}),
  pattern = { "*js", "*.ts", "*.tsx" },
  callback = function()
    vim.api.nvim_command("EslintFixAll")
  end,
})
