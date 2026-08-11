-- Status bar for WezTerm, replacing tmux-powerline after herdr took over as
-- the multiplexer (herdr has no status-bar surface of its own).
--
-- Rendering here is a single small file read: statusd.sh does all sampling in
-- the background and writes key<TAB>value lines. See statusd.sh for cadences.

local wezterm = require 'wezterm'
local palette = require 'status.palette'

local M = {}

local HOME = os.getenv 'HOME'
local CACHE = (os.getenv 'XDG_CACHE_HOME' or (HOME .. '/.cache')) .. '/wezterm-status/status.tsv'
local DAEMON = HOME .. '/code/dotfiles/wezterm/status/statusd.sh'

-- Treat the cache as dead after this many seconds without a daemon heartbeat.
local STALE_AFTER = 10
-- The daemon is idempotent (directory lock), so respawning is safe; this only
-- stops us from spawning once per status tick while it is still starting.
local RESPAWN_EVERY = 15
local last_spawn = 0

local function read_cache()
  local values = {}
  local file = io.open(CACHE, 'r')
  if file == nil then
    return values
  end
  for line in file:lines() do
    local key, value = line:match '^([^\t]+)\t(.*)$'
    if key then
      values[key] = value
    end
  end
  file:close()
  return values
end

-- Explicit interpreter rather than relying on the exec bit: spawning the path
-- directly failed with EACCES from the GUI, and this also survives a checkout
-- that drops file modes.
local function spawn_daemon()
  local ok, err = pcall(wezterm.background_child_process, { '/bin/bash', DAEMON })
  if not ok then
    wezterm.log_error('status: could not start statusd.sh: ' .. tostring(err))
  end
end

local function ensure_daemon(values)
  local now = os.time()
  local heartbeat = tonumber(values.ts or '') or 0
  if now - heartbeat < STALE_AFTER or now - last_spawn < RESPAWN_EVERY then
    return
  end
  last_spawn = now
  spawn_daemon()
end

-- Chevrons where the background changes, matching the old left-hand bar.
local function powerline(cells)
  local items = {}
  for i, cell in ipairs(cells) do
    local following = cells[i + 1] and cells[i + 1].bg or palette.bg
    table.insert(items, { Background = { Color = cell.bg } })
    table.insert(items, { Foreground = { Color = cell.fg } })
    table.insert(items, { Text = ' ' .. cell.text .. ' ' })
    table.insert(items, { Background = { Color = following } })
    table.insert(items, { Foreground = { Color = cell.bg } })
    table.insert(items, { Text = palette.sep_right })
  end
  return items
end

-- One background, thin dividers -- the old right-hand bar's `|` layout.
local function divided(texts)
  local items = { { Background = { Color = palette.bg } } }
  for i, text in ipairs(texts) do
    if i > 1 then
      table.insert(items, { Foreground = { Color = palette.divider } })
      table.insert(items, { Text = ' │ ' })
    end
    table.insert(items, { Foreground = { Color = palette.gold } })
    table.insert(items, { Text = text })
  end
  table.insert(items, { Text = ' ' })
  return items
end

-- Rebuilds tmux-mem-cpu-load's `12/32GB [||        ]  29.0%` from vm_stat and
-- top, so that binary is no longer a dependency.
local function mem_cpu(values)
  local parts = {}
  if values.mem then
    table.insert(parts, values.mem)
  end
  local cpu = tonumber(values.cpu or '')
  if cpu then
    local width = 10
    local filled = math.floor(cpu / 100 * width + 0.5)
    filled = math.max(0, math.min(width, filled))
    table.insert(
      parts,
      string.format('[%s%s] %5.1f%%', string.rep('|', filled), string.rep(' ', width - filled), cpu)
    )
  end
  if #parts == 0 then
    return nil
  end
  return table.concat(parts, ' ')
end

local function left_cells(values)
  local cells = {}
  local function push(text, bg, fg)
    if text and text ~= '' then
      table.insert(cells, { text = text, bg = bg, fg = fg })
    end
  end
  push(values.space, palette.lime, palette.bg)
  push(values.wan_ip, palette.blue, palette.silver)
  push(values.pwd, palette.silver, palette.slate)
  return cells
end

local function right_texts(values)
  local texts = {}
  local function push(text)
    if text and text ~= '' then
      table.insert(texts, text)
    end
  end
  push(values.disk)
  push(mem_cpu(values))
  push(values.net)
  push(wezterm.strftime '%F')
  push(wezterm.strftime '%H:%M')
  return texts
end

function M.setup(config)
  -- A retro tab bar with the tabs themselves hidden is the only full-width,
  -- always-visible strip WezTerm offers -- i.e. a tmux status line.
  config.enable_tab_bar = true
  config.use_fancy_tab_bar = false
  config.show_tabs_in_tab_bar = false
  config.show_new_tab_button_in_tab_bar = false
  config.tab_bar_at_bottom = true
  config.status_update_interval = 1000

  config.colors = config.colors or {}
  config.colors.tab_bar = { background = palette.bg }

  wezterm.on('gui-startup', function()
    spawn_daemon()
  end)

  wezterm.on('update-status', function(window)
    local values = read_cache()
    ensure_daemon(values)
    window:set_left_status(wezterm.format(powerline(left_cells(values))))
    window:set_right_status(wezterm.format(divided(right_texts(values))))
  end)
end

return M
