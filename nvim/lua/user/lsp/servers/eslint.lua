return {
  settings = {
    packageManager = "npm",
    useESLintClass = false,
    experimental = {
      useFlatConfig = false,
    },
    codeActionOnSave = {
      enable = true,
      mode = "all",
    },
    format = false,
    quiet = false,
    onIgnoredFiles = "off",
    rulesCustomizations = {},
    run = "onType",
    problems = {
      shortenToSingleLine = false,
    },
    -- Keeps the cursor in the same position after formatting
    codeAction = {
      disableRuleComment = {
        enable = true,
        location = "separateLine",
      },
      showDocumentation = {
        enable = true,
      },
    },
    -- Only run ESLint when there's a .eslintrc file in the project
    workingDirectory = { mode = "auto" },
  },
  filetypes = {
    "javascript",
    "javascriptreact",
    "javascript.jsx",
    "typescript",
    "typescriptreact",
    "typescript.tsx",
    "vue",
    "svelte",
    "astro",
  },
  -- on_attach will be set by the handler in lsp.lua
  on_attach = function(client, bufnr)
    -- Disable formatting via ESLint (use Prettier instead)
    client.server_capabilities.documentFormattingProvider = false
  end,
}
