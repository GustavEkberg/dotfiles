-- Automatically install packer plugins.lua
--
local ensure_packer = function()
	local fn = vim.fn
	local install_path = fn.stdpath("data") .. "/site/pack/packer/start/packer.nvim"
	if fn.empty(fn.glob(install_path)) > 0 then
		fn.system({ "git", "clone", "--depth", "1", "https://github.com/wbthomason/packer.nvim", install_path })
		vim.cmd([[packadd packer.nvim]])
		return true
	end
	return false
end

local packer_bootstrap = ensure_packer()

-- Autocommand that syncs plugins whenever you save the plugins.lua file
vim.cmd([[
  augroup packer_user_config
    autocmd!
    autocmd BufWritePost plugins.lua source <afile> | PackerSync
  augroup end
]])

local status_ok, packer = pcall(require, "packer")
if not status_ok then
	return
end

return packer.startup({
	function(use)
		use({ "wbthomason/packer.nvim" }) -- Have packer manage itself

		-- Main
		use({ "nvim-lua/plenary.nvim" }) -- Useful lua functions used by lots of plugins
		use({ "kyazdani42/nvim-web-devicons" }) -- ui dependency of many other plugins

		use({ "windwp/nvim-autopairs" }) -- Autopairs, integrates with both cmp and treesitter

		use({ "nvim-neo-tree/neo-tree.nvim" })
		use({ "folke/which-key.nvim" }) -- show shortcuts
		use({ "tpope/vim-surround" })

		use({ "numToStr/Comment.nvim" }) -- Comment lines

    use({ "ThePrimeagen/harpoon"})
    use({ "lukas-reineke/indent-blankline.nvim"})

		use({ "akinsho/toggleterm.nvim" })
		use({ "nvim-lualine/lualine.nvim" })

		use({ "stevearc/dressing.nvim" })
		use({ "rmagatti/goto-preview" })

    use({ "rcarriga/nvim-notify"})
    use({ "MunifTanjim/nui.nvim"})
    
		use({ "folke/zen-mode.nvim" })
		use({ "folke/noice.nvim" })

    use({ "glepnir/dashboard-nvim" }) -- startup

		-- Git
		use({ "kdheepak/lazygit.nvim" })
		use({ "lewis6991/gitsigns.nvim" })

		-- Colorscheme
		use({ "folke/tokyonight.nvim" })
		use({ "uloco/bluloco.nvim" })
		use({ "navarasu/onedark.nvim" })
		use({ "bluz71/vim-moonfly-colors" })
		use({ "preservim/vim-colors-pencil" })
		use({ "rktjmp/lush.nvim" })

		-- Snippets
		use({ "L3MON4D3/LuaSnip" }) --snippet engine
		use({ "honza/vim-snippets" })

		use({ "jackMort/ChatGPT.nvim" })

		-- Telescope
		use({ "nvim-telescope/telescope.nvim" })
		use({ "nvim-telescope/telescope-file-browser.nvim" })
    use({ "nvim-telescope/telescope-fzf-native.nvim",run = "make" })

		-- Treesitter
		use({ "nvim-treesitter/nvim-treesitter" })

		-- LSP
		use({ "neovim/nvim-lspconfig" }) -- enable LSP
		use({ "williamboman/mason.nvim" })
		use({ "williamboman/mason-lspconfig.nvim" })
		use({ "pmizio/typescript-tools.nvim" }) -- Import all missing imports, refactor on move, etc.
		use({ "b0o/schemastore.nvim" }) -- import json schemas from SchemaStore catalog
		use({ "folke/trouble.nvim" }) -- show diagnostics
		use({ "folke/neodev.nvim" }) -- previously named lua-dev
		use({ "j-hui/fidget.nvim" }) -- lsp status

		-- cmp plugins
		use({ "hrsh7th/nvim-cmp" }) -- The completion plugin
		use({ "hrsh7th/cmp-buffer" }) -- buffer completions
		use({ "hrsh7th/cmp-path" }) -- path completions
		use({ "hrsh7th/cmp-nvim-lsp" })
		use({ "hrsh7th/cmp-nvim-lua" })
		use({ "prettier/vim-prettier" })

		use({ "zbirenbaum/copilot.lua" }) -- github copilot
		-- use({ "zbirenbaum/copilot-cmp" }) 
		-- use({ "github/copilot.vim" }) 

    use({ "ggandor/leap.nvim" }) -- jump to any character

	end,
	config = {
		display = {
			open_fn = function()
				-- return require('packer.util').float({ border = 'single' })
				return require("packer.util").float({ border = "rounded" })
			end,
		},
	},
})
