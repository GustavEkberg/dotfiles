local utils = require("user.utils")
local npairs = utils.call_plugin("nvim-autopairs")

npairs.setup({
	check_ts = true, -- treesitter integration
	disable_filetype = { "TelescopePrompt" },
})

local cmp_autopairs = require("nvim-autopairs.completion.cmp")

local cmp = utils.call_plugin("cmp")
cmp.event:on("confirm_done", cmp_autopairs.on_confirm_done({}))
