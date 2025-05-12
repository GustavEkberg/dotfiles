-- Module for handling large file optimizations
local M = {}

-- Configuration
local large_file = {
  size = 1024 * 1024, -- 1MB
  lines = 10000,      -- 10K lines
  line_length = 1000, -- 1K characters in a single line
}

-- Create user commands for manual optimization
vim.api.nvim_create_user_command("OptimizeBuffer", function()
  M.optimize()
  vim.notify("Performance optimizations applied to current buffer", vim.log.levels.INFO)
end, {})

vim.api.nvim_create_user_command("RestoreBuffer", function()
  M.restore()
  vim.notify("Performance optimizations removed from current buffer", vim.log.levels.INFO)
end, {})

-- Function to check if a file is considered "large"
local function is_large_file(bufnr)
  bufnr = bufnr or vim.api.nvim_get_current_buf()

  -- Get file size
  local file_path = vim.api.nvim_buf_get_name(bufnr)
  local ok, stats = pcall(vim.loop.fs_stat, file_path)
  local file_size = (ok and stats) and stats.size or 0

  -- Check file size first (fastest check)
  if file_size > large_file.size then
    return true, "size", file_size
  end

  -- Check number of lines
  local line_count = vim.api.nvim_buf_line_count(bufnr)
  if line_count > large_file.lines then
    return true, "lines", line_count
  end

  -- Check for long lines
  local lines = vim.api.nvim_buf_get_lines(bufnr, 0, -1, false)
  for _, line in ipairs(lines) do
    if #line > large_file.line_length then
      return true, "long_line", #line
    end
  end

  return false
end

-- Apply optimizations for large files
function M.optimize(bufnr)
  bufnr = bufnr or vim.api.nvim_get_current_buf()

  local is_large, reason, value = is_large_file(bufnr)
  if not is_large then
    return
  end

  -- Log the reason for optimization
  local file_name = vim.fn.fnamemodify(vim.api.nvim_buf_get_name(bufnr), ":t")
  vim.notify(string.format(
    "Large file detected (%s: %s). Optimizations applied.",
    reason, value
  ), vim.log.levels.INFO)

  -- Disable syntax highlighting
  vim.cmd("syntax clear")
  vim.cmd("syntax off")

  -- Disable folding
  vim.opt_local.foldenable = false

  -- Disable line wrapping
  vim.opt_local.wrap = false

  -- Disable certain plugins for this buffer
  vim.b[bufnr].large_file = true

  -- Disable treesitter for this buffer
  if pcall(require, "nvim-treesitter") then
    vim.cmd("TSBufDisable highlight")
    vim.cmd("TSBufDisable incremental_selection")
    vim.cmd("TSBufDisable indent")
  end

  -- Disable LSP for this buffer
  if vim.lsp.buf_is_attached then
    for _, client in pairs(vim.lsp.get_active_clients({ bufnr = bufnr })) do
      vim.lsp.buf_detach_client(bufnr, client.id)
    end
  end

  -- Disable indent-blankline
  if pcall(require, "ibl") then
    require("ibl").setup_buffer(bufnr, { enabled = false })
  end

  -- Disable line numbers (optional, but can help with very large files)
  vim.opt_local.number = false
  vim.opt_local.relativenumber = false

  -- Increase the updatetime for this buffer
  vim.opt_local.updatetime = 1000

  -- Disable swapfile for this buffer (optional)
  -- vim.opt_local.swapfile = false

  -- Disable undo for this buffer (optional, improves performance but removes undo capability)
  -- vim.opt_local.undofile = false

  -- Disable spell checking
  vim.opt_local.spell = false

  -- Store the fact that we've optimized this buffer
  vim.b[bufnr].optimized = true
end

-- Restore normal settings for a buffer
function M.restore(bufnr)
  bufnr = bufnr or vim.api.nvim_get_current_buf()

  -- Only restore if the buffer was previously optimized
  if not vim.b[bufnr].optimized then
    vim.notify("This buffer has not been optimized", vim.log.levels.INFO)
    return
  end

  -- Re-enable syntax highlighting
  vim.cmd("syntax on")

  -- Re-enable folding
  vim.opt_local.foldenable = true

  -- Re-enable line wrapping (use your default setting)
  vim.opt_local.wrap = vim.o.wrap

  -- Re-enable treesitter
  if pcall(require, "nvim-treesitter") then
    vim.cmd("TSBufEnable highlight")
    vim.cmd("TSBufEnable incremental_selection")
    vim.cmd("TSBufEnable indent")
  end

  -- Re-enable line numbers
  vim.opt_local.number = vim.o.number
  vim.opt_local.relativenumber = vim.o.relativenumber

  -- Reset updatetime
  vim.opt_local.updatetime = vim.o.updatetime

  -- Re-enable spell checking if it was enabled globally
  vim.opt_local.spell = vim.o.spell

  -- Re-enable indent-blankline
  if pcall(require, "ibl") then
    require("ibl").setup_buffer(bufnr, { enabled = true })
  end

  -- Mark as no longer optimized
  vim.b[bufnr].optimized = false
  vim.b[bufnr].large_file = false
end

return M
