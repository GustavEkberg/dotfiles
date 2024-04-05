local lspconfig = require('lspconfig')
lspconfig.pyright.setup {}
lspconfig.eslint.setup {
  settings = {
    format = {
      enable = true,
    }
  }
}
lspconfig.rust_analyzer.setup {
  -- Server-specific settings. See `:help lspconfig-setup`
  settings = {
    ['rust-analyzer'] = {
        check = {
            command = "clippy";
        },
        diagnostics = {
            enable = true;
        }
    },
  },
}

local function filter_definitions(err, result, ctx, config)
    if err then
        print('LSP Error:', err)
        return
    end
    if not result or vim.tbl_isempty(result) then
        print('No LSP result returned or result is empty.')
        return
    end

    if not vim.tbl_islist(result) then
        result = { result }
    end

    local filtered_results = {}
    for _, location in ipairs(result) do
        if location.targetUri then
            local filename = vim.uri_to_fname(location.targetUri)
            if not (string.match(filename, 'node_modules') or string.match(filename, '.next')) then
                table.insert(filtered_results, location)
            else
                print('Filtered out definition from:', filename)
            end
        end
    end

    if #filtered_results > 0 then
        vim.lsp.handlers['textDocument/definition'](err, filtered_results, ctx, config)
    end
end


lspconfig.tsserver.setup {
  on_attach = function(client, bufnr)
    client.handlers['textDocument/definition'] = filter_definitions
  end
}

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
  pattern = {"*js","*.ts", "*.tsx"},
  callback = function()
    vim.api.nvim_command("PrettierAsync")
  end,
})
