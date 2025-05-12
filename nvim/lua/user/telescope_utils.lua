-- Utility functions for Telescope performance optimization
local M = {}

-- Check if a file is in a git repository
function M.is_git_repo()
  local result = vim.fn.systemlist("git rev-parse --is-inside-work-tree 2>/dev/null")
  return result[1] == "true"
end

-- Get the git root directory
function M.get_git_root()
  local result = vim.fn.systemlist("git rev-parse --show-toplevel 2>/dev/null")
  if vim.v.shell_error ~= 0 then
    return nil
  end
  return result[1]
end

-- Smart find_files function that uses git if available
function M.smart_find_files()
  local opts = {}
  
  if M.is_git_repo() then
    -- Use git_files which is much faster in git repos
    require("telescope.builtin").git_files(opts)
  else
    -- Fall back to find_files for non-git repos
    opts.hidden = true
    require("telescope.builtin").find_files(opts)
  end
end

-- Live grep with smart root directory detection
function M.smart_live_grep()
  local opts = {}
  
  -- If in a git repo, search from git root
  local git_root = M.get_git_root()
  if git_root then
    opts.cwd = git_root
  end
  
  require("telescope.builtin").live_grep(opts)
end

-- Optimized grep_string function
function M.fast_grep_string()
  local opts = {
    word_match = "-w",
    only_sort_text = true,
    search = vim.fn.expand("<cword>"),
  }
  
  -- If in a git repo, search from git root
  local git_root = M.get_git_root()
  if git_root then
    opts.cwd = git_root
  end
  
  require("telescope.builtin").grep_string(opts)
end

-- Find files with preview disabled for speed
function M.find_files_no_preview()
  require("telescope.builtin").find_files({
    previewer = false,
    hidden = true,
  })
end

-- Live grep with preview disabled for speed
function M.live_grep_no_preview()
  require("telescope.builtin").live_grep({
    previewer = false,
  })
end

-- Toggle preview in Telescope
function M.toggle_telescope_preview()
  local action_state = require("telescope.actions.state")
  local actions = require("telescope.actions")
  
  return function(prompt_bufnr)
    local current_picker = action_state.get_current_picker(prompt_bufnr)
    current_picker.previewer.state.previewing = not current_picker.previewer.state.previewing
    
    -- Refresh the picker to apply the change
    actions.refresh(prompt_bufnr)
  end
end

return M
