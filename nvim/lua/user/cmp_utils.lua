-- Utility functions for nvim-cmp performance optimization
local M = {}

-- Check if a file is considered large
function M.is_large_file(bufnr)
  bufnr = bufnr or vim.api.nvim_get_current_buf()
  
  -- Check file size
  local max_filesize = 1 * 1024 * 1024 -- 1 MB
  local ok, stats = pcall(vim.loop.fs_stat, vim.api.nvim_buf_get_name(bufnr))
  if ok and stats and stats.size > max_filesize then
    return true
  end
  
  -- Check line count
  local line_count = vim.api.nvim_buf_line_count(bufnr)
  if line_count > 10000 then
    return true
  end
  
  -- Check for long lines
  local lines = vim.api.nvim_buf_get_lines(bufnr, 0, 100, false)
  for _, line in ipairs(lines) do
    if #line > 1000 then
      return true
    end
  end
  
  return false
end

-- Disable completion for large files
function M.setup_large_file_detection()
  vim.api.nvim_create_autocmd("BufReadPost", {
    callback = function()
      if M.is_large_file() then
        vim.b.cmp_enabled = false
        vim.notify("File is large, completions disabled", vim.log.levels.INFO)
      end
    end,
  })
end

-- Toggle completion on/off
function M.toggle_completion()
  if vim.b.cmp_enabled == false then
    vim.b.cmp_enabled = true
    vim.notify("Completions enabled", vim.log.levels.INFO)
  else
    vim.b.cmp_enabled = false
    vim.notify("Completions disabled", vim.log.levels.INFO)
  end
end

-- Create user commands
function M.setup_commands()
  vim.api.nvim_create_user_command("ToggleCompletion", function()
    M.toggle_completion()
  end, {})
end

return M
