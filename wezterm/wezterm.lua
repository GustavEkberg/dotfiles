local wezterm = require 'wezterm'
local io = require 'io'
local os = require 'os'
local act = wezterm.action

local config = wezterm.config_builder()

config.front_end = "WebGpu"

-- Window configuration
config.color_scheme = 'Tokyo Night'
config.hide_tab_bar_if_only_one_tab = true

config.window_decorations = "RESIZE"
config.window_background_opacity = 0.9
config.macos_window_background_blur = 30

-- Font configuration
config.font_size = 13

-- Events
wezterm.on('trigger-vim-with-scrollback', function(window, pane)
  -- Retrieve the text from the pane
  local text = pane:get_lines_as_text(pane:get_dimensions().scrollback_rows)

  -- Create a temporary file to pass to vim
  local name = os.tmpname()
  local f = io.open(name, 'w+')
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
config.leader = { key = 'a', mods = 'CTRL' }
config.keys = {
  {
    key="n", 
    mods="LEADER", 
    action=act.ActivateTabRelative(1)
  },
  {
    key="v", 
    mods="LEADER", 
    action=act{SplitVertical={domain="CurrentPaneDomain"}}
  },
  {
    key="s", 
    mods="LEADER", 
    action=act{SplitHorizontal={domain="CurrentPaneDomain"}}
  },
  {
    key = 'p',
    mods = 'LEADER',
    action = act.ActivateCommandPalette,
  },
  {
    key = 'e',
    mods = 'LEADER',
    action = act.EmitEvent 'trigger-vim-with-scrollback',
  }
}

return config
