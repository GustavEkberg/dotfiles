local utils = require("user.utils")
local ts_context = utils.call_plugin("treesitter-context")

ts_context.setup({
  max_lines = 10, -- How many lines the window should span. Values <= 0 mean no limit.
})
