return {
  settings = {
    python = {
      analysis = {
        -- Use mypy for type checking instead of pyright's built-in checker
        typeCheckingMode = "off",
        -- Auto-import completions
        autoImportCompletions = true,
        -- Auto-search paths
        autoSearchPaths = true,
        -- Use library code for types
        useLibraryCodeForTypes = true,
        -- Diagnostics mode
        diagnosticMode = "workspace",
      },
    },
  },
}

