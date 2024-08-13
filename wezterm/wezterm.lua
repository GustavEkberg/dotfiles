local wezterm = require 'wezterm'
local act = wezterm.action

local config = wezterm.config_builder()

-- Window configuration
config.color_scheme = 'Tokyo Night'
-- config.hide_tab_bar_if_only_one_tab = true
config.tab_bar_at_bottom = true

config.window_decorations = "RESIZE"
config.window_background_opacity = 0.9
config.macos_window_background_blur = 30

-- Font configuration
config.font_size = 13

-- Keybindings
config.leader = { key = 'a', mods = 'CTRL' }
config.keys = {
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
}

-- Status bar
wezterm.on('update-status', function(window)
  -- Grab the utf8 character for the "powerline" left facing
  -- solid arrow.
  local SOLID_LEFT_ARROW = utf8.char(0xe0b2)

  -- Grab the current window's configuration, and from it the
  -- palette (this is the combination of your chosen colour scheme
  -- including any overrides).
  local color_scheme = window:effective_config().resolved_palette
  local bg = color_scheme.background
  local fg = color_scheme.foreground

  window:set_right_status(wezterm.format({
    -- First, we draw the arrow...
    { Background = { Color = 'none' } },
    { Foreground = { Color = bg } },
    { Text = SOLID_LEFT_ARROW },
    -- Then we draw our text
    { Background = { Color = bg } },
    { Foreground = { Color = fg } },
    { Text = ' ' .. wezterm.time.now():format("%Y-%m-%d %H:%M") .. ' ' },
  }))
end)
return config
