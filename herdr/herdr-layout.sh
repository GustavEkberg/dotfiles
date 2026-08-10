#!/usr/bin/env bash
# Build the default pane layout in the current tab:
#   +----------------+-----------+
#   |                |  lazygit  |
#   |     claude     |           |
#   |                +-----------+
#   |                | cli (short)
#   +----------------+-----------+
# Base pane becomes claude and keeps focus.
# usage: herdr-layout.sh
set -euo pipefail

HERDR="${HERDR_BIN:-/opt/homebrew/bin/herdr}"
JQ="${JQ_BIN:-/usr/bin/jq}"

# Fraction of tab width kept by the left column / of right-column height kept by lazygit.
LEFT_RATIO="${HERDR_LAYOUT_LEFT_RATIO:-0.5}"
GIT_RATIO="${HERDR_LAYOUT_GIT_RATIO:-0.85}"

# Keybinding shells run detached without pane context; fall back to UI focus.
if [ -n "${HERDR_PANE_ID:-}" ]; then
  base_json=$("$HERDR" pane get "$HERDR_PANE_ID")
else
  base_json=$("$HERDR" pane current)
fi
base=$("$JQ" -r '.result.pane.pane_id' <<<"$base_json")
cwd=$("$JQ" -r '.result.pane.foreground_cwd // .result.pane.cwd' <<<"$base_json")

right=$("$HERDR" pane split "$base" --direction right --ratio "$LEFT_RATIO" \
  --cwd "$cwd" --no-focus | "$JQ" -r '.result.pane.pane_id')
"$HERDR" pane split "$right" --direction down --ratio "$GIT_RATIO" \
  --cwd "$cwd" --no-focus >/dev/null

"$HERDR" pane run "$right" lazygit >/dev/null
"$HERDR" pane run "$base" claude >/dev/null
