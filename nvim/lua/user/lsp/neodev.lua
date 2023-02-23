local neodev_status_ok, neodev = pcall(require, "neodev")
if not neodev_status_ok then
	return
end

-- IMPORTANT: make sure to setup neodev BEFORE lspconfig
neodev.setup()
