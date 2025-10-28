-- Shorten function name
local keymap = vim.keymap.set

local opts = { silent = true }

--Remap space as leader key
keymap("", "<Space>", "<Nop>", opts)
vim.g.mapleader = " "

keymap("v", "Y", '"*y') -- Yank to clipboard
keymap("n", "<F8>", "<cmd>:LspHover<CR>")
keymap("n", "<F12>", ":lua vim.lsp.buf.code_action()<CR>")
keymap("n", "<C-d>", "<C-d>zz")
keymap("n", "<C-u>", "<C-u>zz")
keymap("n", "<C-b>", "<cmd>b#<CR>")

keymap("n", "<C-h>", "<cmd>lua require('harpoon.ui').toggle_quick_menu()<CR>")

-- Move lines up and down
vim.api.nvim_set_keymap('n', '<C-j>', ':m .+1<CR>==', { noremap = true, silent = true })
vim.api.nvim_set_keymap('n', '<C-k>', ':m .-2<CR>==', { noremap = true, silent = true })
vim.api.nvim_set_keymap('v', '<C-j>', ":m '>+1<CR>gv=gv", { noremap = true, silent = true })
vim.api.nvim_set_keymap('v', '<C-k>', ":m '<-2<CR>gv=gv", { noremap = true, silent = true })

keymap("n", "Q", "<cmd>:q<CR>")

-- Remove defaults from normal mode
keymap("v", "u", "<nop>")
keymap("v", "U", "<nop>")

keymap('n', '<C-s>', '<cmd>lua _G._LAZYGIT_TOGGLE()<CR>', { noremap = true, silent = true })
keymap('t', '<C-s>', '<cmd>lua _G._LAZYGIT_TOGGLE()<CR>', { noremap = true, silent = true })

local utils = require("user.utils")
local wk = utils.call_plugin("which-key")

-- Registers
local esc = vim.api.nvim_replace_termcodes("<Esc>", true,true, true)
vim.fn.setreg("l","yoconsole.log('" .. esc .. "pa:'," .. esc .. "pa)" .. esc)
vim.fn.setreg("k","yoconsole.log('" .. esc .. "pa:'," .. esc .. "pa)" .. esc .. "dd" .. esc)


-- UUIDs
local insert_lowercase_uuid = function()
  local uuid = vim.fn.system('uuidgen'):gsub('\n', ''):lower()
  vim.api.nvim_put({uuid}, 'c', true, true)
end

-- Augment
keymap('i', '<C-l>', function() vim.api.nvim_call_function('augment#Accept', {}) end, { noremap = true })

-- Toggle between implementation and test files
local toggle_test_file = function()
  local current_file = vim.fn.expand('%:p')

  -- Check if it's a JavaScript or TypeScript file
  if not (current_file:match('%.ts$') or current_file:match('%.js$') or
          current_file:match('%.tsx$') or current_file:match('%.jsx$')) then
    vim.notify("Not a JavaScript or TypeScript file", vim.log.levels.WARN)
    return
  end

  local is_test_file = current_file:match('%.test%.')
  local target_file

  if is_test_file then
    -- If current file is a test file, go to the implementation file
    -- Example: file.test.ts -> file.ts
    target_file = current_file:gsub('%.test%.', '.')
  else
    -- If current file is an implementation file, go to the test file
    -- Example: file.ts -> file.test.ts
    local ext = current_file:match('%.([^%.]+)$')
    target_file = current_file:gsub('%.' .. ext .. '$', '.test.' .. ext)
  end

  -- Check if the target file exists
  local f = io.open(target_file, "r")
  if f then
    f:close()
    vim.cmd('edit ' .. vim.fn.fnameescape(target_file))
  else
    vim.notify("Target file does not exist: " .. target_file, vim.log.levels.WARN)
  end
end

-- Set up the keymapping for Ctrl+g
keymap('n', '<C-g>', toggle_test_file, { noremap = true, silent = true, desc = "Toggle between file and test file" })

-- ESLint fix function
local eslint_fix = function()
  -- Find project root by looking for package.json
  local project_root = vim.fn.findfile('package.json', '.;')
  if project_root == '' then
    vim.notify("No package.json found - not a Node.js project", vim.log.levels.WARN)
    return
  end

  project_root = vim.fn.fnamemodify(project_root, ':h')
  local eslint_path = project_root .. '/node_modules/.bin/eslint'

  -- Check if ESLint exists
  if vim.fn.executable(eslint_path) == 0 then
    vim.notify("ESLint not found in node_modules/.bin/", vim.log.levels.WARN)
    return
  end

  vim.notify("Running ESLint fix...", vim.log.levels.INFO)

  -- Run ESLint fix from project root
  local cmd = 'cd ' .. vim.fn.shellescape(project_root) .. ' && ./node_modules/.bin/eslint --fix'
  local result = vim.fn.system(cmd)

  -- Reload all open buffers to show changes
  vim.cmd('bufdo e!')

  if vim.v.shell_error == 0 then
    vim.notify("ESLint fix completed successfully", vim.log.levels.INFO)
  else
    vim.notify("ESLint fix completed with warnings/errors", vim.log.levels.WARN)
  end
end


wk.add({
    { "<leader>R", "<cmd>LspRestart<CR>", desc = "Restart LSP" },
    { "<leader>W", "<C-w>W", desc = "Focus Previous window" },
    { "<leader>r", "<cmd>e!<CR>", desc = "Reload buffer" },
    { "<leader>s", "<cmd>w!<CR>", desc = "Save buffer" },
    { "<leader>w", "<C-w>w", desc = "Focus next window" },
    { "<C-g>", toggle_test_file, desc = "Toggle between file and test file" },

    { "<leader>m", group = "Homemade" },
    { "<leader>md", insert_lowercase_uuid, desc = "Insert UUID" },
    { "<leader>mm", "<cmd>wincmd =<CR>", desc = "Resize windows" },
    { "<leader>mz", "<cmd>ZenMode<CR>", desc = "Zen Mode" },
    { "<leader>mp", "<cmd>OptimizeBuffer<CR>", desc = "Performance mode (optimize)" },
    { "<leader>mr", "<cmd>RestoreBuffer<CR>", desc = "Restore normal mode" },
    { "<leader>mc", "<cmd>ToggleCompletion<CR>", desc = "Toggle completion" },
    { "<leader>mf", eslint_fix, desc = "ESLint fix" },

    { "<leader>a", group = "Actions" },
    { "<leader>af", function() require("conform").format({ async = true, lsp_fallback = true }) end, desc = "Format buffer" },

    { "<leader>i", group = "Issues (Trouble)" },
    { "<leader>ii", "<cmd>Trouble diagnostics toggle<CR>", desc = "Toggle diagnostics" },
    { "<leader>iI", "<cmd>Trouble diagnostics toggle filter.buf=0<CR>", desc = "Toggle buffer diagnostics" },
    { "<leader>ir", "<cmd>Trouble lsp toggle focus=false<CR>", desc = "LSP references/definitions" },
    { "<leader>is", "<cmd>Trouble symbols toggle focus=false<CR>", desc = "Document symbols" },
    { "<leader>il", "<cmd>Trouble loclist toggle<CR>", desc = "Location list" },
    { "<leader>iq", "<cmd>Trouble qflist toggle<CR>", desc = "Quickfix list" },
})
