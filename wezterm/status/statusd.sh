#!/usr/bin/env bash
# Background sampler for the WezTerm status bar.
#
# Each segment runs on its own cadence and caches its rendered lines; the
# assembled TSV is all that wezterm/status/init.lua reads on a status tick.
# Sampling never happens on the render path -- that was the tmux-powerline
# problem this replaces, where `powerline.sh right` took 1.67s against a 1s
# status-interval and left the bar permanently stale.
#
# Usage: statusd.sh [--once]
set -euo pipefail

# WezTerm spawns this from the GUI, whose PATH has no Homebrew in it. Without
# this, `herdr` and `jq` go missing and the space/pwd segments silently freeze
# on their last value while the /usr/bin-only segments keep updating.
PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export PATH

STATUS_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_DIR="${XDG_CACHE_HOME:-$HOME/.cache}/wezterm-status"
SEG_DIR="$CACHE_DIR/seg"
STATE_DIR="$CACHE_DIR/state"
OUT="$CACHE_DIR/status.tsv"
LOCK="$CACHE_DIR/statusd.lock"

# name:interval_seconds. Cheap segments poll often; anything costing a network
# round-trip or a sampling window is pushed out as far as it stays useful.
SCHEDULE="space_pwd:1 mem:2 net:2 cpu:5 disk:60 wan_ip:900"

mkdir -p "$SEG_DIR" "$STATE_DIR"

for segment_file in "$STATUS_HOME"/segments/*.sh; do
  # shellcheck source=/dev/null
  . "$segment_file"
done

now() {
  date +%s
}

mtime() {
  stat -f %m "$1" 2>/dev/null || echo 0
}

is_due() {
  local file="$1" interval="$2"
  [ -f "$file" ] || return 0
  [ $(( $(now) - $(mtime "$file") )) -ge "$interval" ]
}

# A segment emits zero or more "key<TAB>value" lines. On failure the previous
# value is kept and its clock restarted, so a flaky network blanks nothing.
sample() {
  local name="$1" file="$SEG_DIR/$1" tmp
  tmp="$SEG_DIR/.$1.$$"
  if "segment_$name" >"$tmp" 2>/dev/null; then
    mv -f "$tmp" "$file"
  else
    rm -f "$tmp"
    touch "$file"
  fi
}

assemble() {
  local tmp="$CACHE_DIR/.status.$$"
  cat "$SEG_DIR"/* 2>/dev/null >"$tmp" || :
  # Lets the renderer notice a dead daemon and restart it.
  printf 'ts\t%s\n' "$(now)" >>"$tmp"
  mv -f "$tmp" "$OUT"
}

tick() {
  local force="${1:-}" entry name interval
  for entry in $SCHEDULE; do
    name="${entry%%:*}"
    interval="${entry##*:}"
    if [ -n "$force" ] || is_due "$SEG_DIR/$name" "$interval"; then
      sample "$name"
    fi
  done
  assemble
}

# macOS has no flock, so the lock is a directory plus a pid we can probe.
acquire_lock() {
  local pid
  if mkdir "$LOCK" 2>/dev/null; then
    echo $$ >"$LOCK/pid"
    return 0
  fi
  pid="$(cat "$LOCK/pid" 2>/dev/null || echo)"
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    exit 0
  fi
  rm -rf "$LOCK"
  mkdir "$LOCK" 2>/dev/null || exit 0
  echo $$ >"$LOCK/pid"
}

if [ "${1:-}" = "--once" ]; then
  tick force
  exit 0
fi

acquire_lock
trap 'rm -rf "$LOCK"' EXIT INT TERM

# Outliving the terminal would leave an orphaned poller behind.
while pgrep -qx wezterm-gui; do
  tick
  sleep 1
done
