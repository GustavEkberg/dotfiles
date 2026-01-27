return {
  -- LSP Configuration
  {
    "neovim/nvim-lspconfig",
    dependencies = {
      "mason.nvim",
      "mason-lspconfig.nvim",
    },
  },

  {
    "mason-org/mason.nvim",
    build = ":MasonUpdate",
    config = function()
      require("mason").setup({
        ui = {
          border = "none",
          icons = {
            package_installed = "◍",
            package_pending = "◍",
            package_uninstalled = "◍",
          },
        },
        log_level = vim.log.levels.INFO,
        max_concurrent_installers = 4,
      })
    end,
  },

  {
    "mason-org/mason-lspconfig.nvim",
    dependencies = {
      "mason.nvim",
    },
    config = function()
      local on_attach = require("user.lsp.handlers").on_attach
      local capabilities = require("user.lsp.handlers").capabilities

      require("mason-lspconfig").setup({
        ensure_installed = {
          "pyright",
          "html",
          "tailwindcss",
          "prismals",
          "lua_ls",
          "bashls",
          "jsonls",
          "eslint",
          "yamlls",
        },
        automatic_installation = true,
        handlers = {
          -- Default handler for all servers
          function(server_name)
            local opts = {
              on_attach = on_attach,
              capabilities = capabilities,
            }

            -- Check if there's a custom config for this server
            local require_ok, conf_opts = pcall(require, "user.lsp.servers." .. server_name)
            if require_ok then
              opts = vim.tbl_deep_extend("force", conf_opts, opts)
            end

            require("lspconfig")[server_name].setup(opts)
          end,
        },
      })
    end,
  },

  -- Install formatters, linters, and other tools
  {
    "WhoIsSethDaniel/mason-tool-installer.nvim",
    dependencies = {
      "mason.nvim",
    },
    config = function()
      require("mason-tool-installer").setup({
        ensure_installed = {
          "ruff",  -- Python formatter and linter (replaces black, isort, flake8)
          "mypy",  -- Python type checker
          "prettier", -- JS/TS/CSS/HTML/JSON/YAML/MD formatter
        },
        auto_update = false,
        run_on_start = true,
      })
    end,
  },

  -- Formatting plugin
  {
    "stevearc/conform.nvim",
    event = { "BufWritePre" },
    cmd = { "ConformInfo" },
    config = function()
      require("conform").setup({
        formatters_by_ft = {
          python = { "ruff_format", "ruff_organize_imports" },
          javascript = { "prettier" },
          javascriptreact = { "prettier" },
          typescript = { "prettier" },
          typescriptreact = { "prettier" },
          css = { "prettier" },
          html = { "prettier" },
          json = { "prettier" },
          jsonc = { "prettier" },
          yaml = { "prettier" },
          markdown = { "prettier" },
          graphql = { "prettier" },
        },
        -- Format on save
        format_on_save = function(bufnr)
          -- Get the current buffer's name (file path)
          local bufname = vim.api.nvim_buf_get_name(bufnr)

          -- Don't format JS/TS files if ESLint is handling it
          -- Remove this check if you want Prettier to handle all JS/TS formatting
          if bufname:match("%.jsx?$") or bufname:match("%.tsx?$") then
            -- Use Prettier for JS/TS files
            return {
              timeout_ms = 1000,
              lsp_fallback = false,
            }
          end

          -- Format Python and other files
          return {
            timeout_ms = 500,
            lsp_fallback = true,
          }
        end,
      })
    end,
  },

  -- Linting plugin for mypy
  {
    "mfussenegger/nvim-lint",
    event = { "BufReadPre", "BufNewFile" },
    config = function()
      local lint = require("lint")

      -- Configure linters by filetype
      lint.linters_by_ft = {
        python = { "mypy" },
      }

      -- Set a shorter delay for linting
      vim.g.lint_delay = 100

      -- Create autocommand to run linters
      local lint_augroup = vim.api.nvim_create_augroup("lint", { clear = true })

      vim.api.nvim_create_autocmd({ "BufEnter", "BufWritePost", "InsertLeave", "TextChanged" }, {
        group = lint_augroup,
        callback = function()
          lint.try_lint()
        end,
      })

      -- Also run on CursorHold for real-time feedback
      vim.api.nvim_create_autocmd("CursorHold", {
        group = lint_augroup,
        callback = function()
          lint.try_lint()
        end,
      })
    end,
  },

  {
    "folke/neodev.nvim",
    config = function()
      require("neodev").setup()
    end,
  },

  {
    "pmizio/typescript-tools.nvim",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "neovim/nvim-lspconfig",
    },
    config = function()
      local handlers = require("user.lsp.handlers")

      require("typescript-tools").setup({
        on_attach = handlers.on_attach,
        settings = {
          -- spawn additional tsserver instance to calculate diagnostics on it
          separate_diagnostic_server = true,
          -- "change"|"insert_leave" determine when the client asks the server about diagnostic
          publish_diagnostic_on = "insert_leave",
          -- array of strings("fix_all"|"add_missing_imports"|"remove_unused"|
          -- "remove_unused_imports"|"organize_imports") -- or string "all"
          -- to include all supported code actions
          -- specify commands exposed as code_actions
          expose_as_code_action = {},
          -- string|nil - specify a custom path to `tsserver.js` file, if this is nil or file under path
          -- not exists then standard path resolution strategy is applied
          tsserver_path = nil,
          -- specify a list of plugins to load by tsserver, e.g., for support `styled-components`
          tsserver_plugins = {},
          -- this value is passed to: https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes
          -- memory limit in megabytes or "auto"(basically no limit)
          tsserver_max_memory = "auto",
          -- Format options for TypeScript
          tsserver_format_options = {
            insertSpaceAfterCommaDelimiter = true,
            insertSpaceAfterConstructor = false,
            insertSpaceAfterSemicolonInForStatements = true,
            insertSpaceBeforeAndAfterBinaryOperators = true,
            insertSpaceAfterKeywordsInControlFlowStatements = true,
            insertSpaceAfterFunctionKeywordForAnonymousFunctions = true,
            insertSpaceBeforeFunctionParenthesis = false,
            insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis = false,
            insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets = false,
            insertSpaceAfterOpeningAndBeforeClosingEmptyBraces = true,
            insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces = false,
            insertSpaceAfterOpeningAndBeforeClosingJsxExpressionBraces = false,
            insertSpaceAfterTypeAssertion = false,
            placeOpenBraceOnNewLineForFunctions = false,
            placeOpenBraceOnNewLineForControlBlocks = false,
            semicolons = "insert",
            indentSize = 2,
            tabSize = 2,
            convertTabsToSpaces = true,
          },
          tsserver_file_preferences = {
            quotePreference = "double",
            importModuleSpecifierPreference = "relative",
            allowTextChangesInNewFiles = true,
            providePrefixAndSuffixTextForRename = true,
            allowRenameOfImportPath = true,
            includeAutomaticOptionalChainCompletions = true,
            provideRefactorNotApplicableReason = true,
            generateReturnInDocTemplate = true,
            includeCompletionsForImportStatements = true,
            includeCompletionsWithSnippetText = true,
            includeCompletionsWithClassMemberSnippets = true,
            includeCompletionsWithObjectLiteralMethodSnippets = true,
            useLabelDetailsInCompletionEntries = true,
            allowIncompleteCompletions = true,
            displayPartsForJSDoc = true,
            disableLineTextInReferences = true,
          },
          -- locale of all tsserver messages
          tsserver_locale = "en",
          -- mirror of VSCode's `typescript.suggest.completeFunctionCalls`
          complete_function_calls = false,
          include_completions_with_insert_text = true,
          -- CodeLens
          -- WARNING: Experimental feature also in VSCode, because it might hit performance of server.
          -- possible values: ("off"|"all"|"implementations_only"|"references_only")
          code_lens = "off",
          -- by default code lenses are displayed on all referencable values and for some of you it can
          -- be too much this option reduce count of them by removing member references from lenses
          disable_member_code_lens = true,
          -- JSXCloseTag
          -- WARNING: it is disabled by default (maybe you configuration or distro already uses nvim-ts-autotag,
          -- that maybe have a conflict if enable this feature. )
          jsx_close_tag = {
            enable = false,
            filetypes = { "javascriptreact", "typescriptreact" },
          }
        }
      })
    end,
  },

  {
    "b0o/schemastore.nvim",
  },

  {
    "folke/trouble.nvim",
    dependencies = {
      "nvim-tree/nvim-web-devicons",
    },
    config = function()
      require("trouble").setup()
    end,
  },

  {
    "j-hui/fidget.nvim",
    config = function()
      require("fidget").setup({
        -- Options related to LSP progress subsystem
        progress = {
          poll_rate = 0,                -- How and when to poll for progress messages
          suppress_on_insert = false,   -- Suppress new messages while in insert mode
          ignore_done_already = false,  -- Ignore new tasks that are already complete
          ignore_empty_message = false, -- Ignore new tasks that don't contain a message
          clear_on_detach =             -- Clear notification group when LSP server detaches
            function(client_id)
              local client = vim.lsp.get_client_by_id(client_id)
              return client and client.name or nil
            end,
          notification_group =          -- How to get a progress message's notification group key
            function(msg) return msg.lsp_client.name end,
          ignore = {},                  -- List of LSP servers to ignore
        },

        -- Options related to notification subsystem
        notification = {
          poll_rate = 10,               -- How frequently to update and render notifications
          filter = vim.log.levels.INFO, -- Minimum notifications level
          history_size = 128,           -- Number of removed messages to retain in history
          override_vim_notify = false,  -- Automatically override vim.notify() with Fidget
        },

        -- Options related to integrating with other plugins
        integration = {
          ["nvim-tree"] = {
            enable = true,              -- Integrate with nvim-tree/nvim-tree.lua (if installed)
          },
          ["xcodebuild-nvim"] = {
            enable = true,              -- Integrate with wojciech-kulik/xcodebuild.nvim (if installed)
          },
        },
      })

      -- Suppress LSP progress messages
      vim.cmd("Fidget lsp_suppress")
    end,
  },

  -- Treesitter
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    config = function()
      require("nvim-treesitter.configs").setup({
        ensure_installed = "all",
        highlight = {
          enable = true,
          additional_vim_regex_highlighting = true,
        },
        indent = { enable = true },
      })
    end,
  },

  {
    "nvim-treesitter/nvim-treesitter-context",
    dependencies = {
      "nvim-treesitter/nvim-treesitter",
    },
    config = function()
      require("treesitter-context").setup()
    end,
  },
}
