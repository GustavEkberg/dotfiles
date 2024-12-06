local wezterm = require 'wezterm'
local io = require 'io'
local os = require 'os'
local act = wezterm.action

local config = wezterm.config_builder()

-- Window configuration
config.color_scheme = 'deep'
config.font = wezterm.font('JetBrains Mono')
config.enable_tab_bar = false

config.window_decorations = "RESIZE"
config.window_background_opacity = 0.8
config.macos_window_background_blur = 30
config.freetype_load_target = "Normal"
config.mouse_bindings = {
	-- CMD-click will open the link under the mouse cursor
	{
		event = { Up = { streak = 1, button = "Left" } },
		mods = "SUPER",
		action = wezterm.action.OpenLinkAtMouseCursor,
	},
}
wezterm.on("open-uri", function(window, pane, uri)
	wezterm.log_info(window)
	wezterm.log_info(pane)
	wezterm.log_info(uri)
end)
-- config.default_cursor_style = "BlinkingBlock"

-- Font configuration
config.font_size = 13
config.harfbuzz_features = { 'calt=0', 'clig=0', 'liga=0' }

-- Events
wezterm.on('trigger-vim-with-scrollback', function(window, pane)
  -- Retrieve the text from the pane
  local text = pane:get_lines_as_text(pane:get_dimensions().scrollback_rows)

  -- Create a temporary file to pass to vim
  local name = os.tmpname()
  local f = io.open(name, 'w+')
  if f == nil then
    return
  end
  f:write(text)
  f:flush()
  f:close()

  -- Open a new window running vim and tell it to open the file
  window:perform_action(
    act.SpawnCommandInNewWindow {
      args = { 'vim', name },
    },
    pane
  )

  -- Wait "enough" time for vim to read the file before we remove it.
  -- The window creation and process spawn are asynchronous wrt. running
  -- this script and are not awaitable, so we just pick a number.
  --
  -- Note: We don't strictly need to remove this file, but it is nice
  -- to avoid cluttering up the temporary directory.
  wezterm.sleep_ms(1000)
  os.remove(name)
end)

-- Keybindings
config.leader = { key = 'x', mods = 'CTRL' }
config.keys = {
  {
    key = 'e',
    mods = 'LEADER',
    action = act.EmitEvent 'trigger-vim-with-scrollback',
  }
}

return config
