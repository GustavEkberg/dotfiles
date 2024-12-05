local utils = require("user.utils")

local harpoon = require("harpoon")

-- Ensure to include the proper parameters in the setup call:
harpoon:setup({
    settings = {
        -- These should be booleans inside the settings table
        save_on_toggle = true,
        sync_on_ui_close = true,
    },
})
vim.keymap.set("n", "<S-F1>", function() harpoon:list():select(1) end, { noremap = true, silent = true })
vim.keymap.set("n", "<S-F2>", function() harpoon:list():select(2) end, { noremap = true, silent = true })
vim.keymap.set("n", "<S-F3>", function() harpoon:list():select(3) end, { noremap = true, silent = true })
vim.keymap.set("n", "<S-F4>", function() harpoon:list():select(4) end, { noremap = true, silent = true })
vim.keymap.set("n", "<S-F5>", function() harpoon:list():select(5) end, { noremap = true, silent = true })
vim.keymap.set("n", "<S-F6>", function() harpoon:list():select(6) end, { noremap = true, silent = true })
vim.keymap.set("n", "<S-F7>", function() harpoon:list():select(7) end, { noremap = true, silent = true })
vim.keymap.set("n", "<S-F8>", function() harpoon:list():select(8) end, { noremap = true, silent = true })
vim.keymap.set("n", "<S-F9>", function() harpoon:list():select(9) end, { noremap = true, silent = true })

local wk = utils.call_plugin("which-key")
if (wk == nil) then
    return
end
  wk.add({
    { "<leader>b", group = "Harpoon" },
    { "<leader>ba", function() harpoon:list():add() end, desc = "Add file to Harpoon" },
    { "<leader>bb", function() harpoon:list():next() end, desc = "Navigate to next file" },
    { "<leader>bs", function() harpoon.ui:toggle_quick_menu(harpoon:list()) end, desc = "Toggle menu" },
})
