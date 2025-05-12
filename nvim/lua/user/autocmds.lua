local api = vim.api

local rust_group = api.nvim_create_augroup("Rust", { clear = true })
api.nvim_create_autocmd("BufWritePost", {
	command = "silent !cargo fmt",
	group = rust_group,
	pattern = "*.rs",
})

-- Spelling ignore patterns
local function applyCustomSyntax()
  vim.cmd([[syntax match uuidPattern "\v[0-9a-fA-F]{8}(\-[0-9a-fA-F]{4}){3}\-[0-9a-fA-F]{12}" containedin=ALL]])
  vim.cmd([[hi! link uuidPattern NoSpell]])
  vim.cmd([[syntax match hexColor "#\x\{3,4}\|#[0-9a-fA-F]\{6}\|#[0-9a-fA-F]\{8}" containedin=ALL]])
  vim.cmd([[hi! link hexColor NoSpell]])
end

vim.api.nvim_create_autocmd("BufEnter", {
    pattern = "*",
    callback = applyCustomSyntax,
})

-- Large file optimizations
local large_file_group = api.nvim_create_augroup("LargeFile", { clear = true })

-- Check file size when opening
api.nvim_create_autocmd({"BufReadPre"}, {
  group = large_file_group,
  pattern = "*",
  callback = function(args)
    -- Defer the optimization to ensure all buffer properties are available
    vim.defer_fn(function()
      require("user.large_file").optimize(args.buf)
    end, 0)
  end,
})

-- Special handling for SQL files which often have long lines
api.nvim_create_autocmd({"BufReadPre"}, {
  group = large_file_group,
  pattern = "*.sql",
  callback = function(args)
    -- Lower thresholds for SQL files
    vim.b[args.buf].sql_file = true

    -- Check after a short delay to ensure the buffer is fully loaded
    vim.defer_fn(function()
      -- For SQL files, we'll be more aggressive with optimizations
      local lines = vim.api.nvim_buf_get_lines(args.buf, 0, -1, false)
      for _, line in ipairs(lines) do
        -- If any line is longer than 500 characters, apply optimizations
        if #line > 500 then
          require("user.large_file").optimize(args.buf)
          break
        end
      end
    end, 100)
  end,
})
