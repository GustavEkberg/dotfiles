#!/usr/bin/env bash
# Move the focused space one position up or down (numbers follow order).
# No CLI wrapper exists for workspace.move, so this speaks raw newline-JSON
# to the socket API.
# usage: herdr-move-space.sh up|down
set -euo pipefail

HERDR="${HERDR_BIN:-/opt/homebrew/bin/herdr}"
JQ="${JQ_BIN:-/usr/bin/jq}"
SOCK="${HERDR_SOCK:-$HOME/.config/herdr/herdr.sock}"

dir="${1:-}"
[ "$dir" = "up" ] || [ "$dir" = "down" ] || { echo "usage: herdr-move-space.sh up|down" >&2; exit 2; }

list=$("$HERDR" workspace list)
read -r id number < <("$JQ" -r '.result.workspaces[] | select(.focused) | "\(.workspace_id) \(.number)"' <<<"$list")
count=$("$JQ" -r '.result.workspaces | length' <<<"$list")
[ -n "$id" ] || exit 0

# insert_index means "insert before the element at that pre-removal index",
# so down needs to skip past the next element.
if [ "$dir" = "up" ]; then
  [ "$number" -gt 1 ] || exit 0
  index=$((number - 2))
else
  [ "$number" -lt "$count" ] || exit 0
  index=$((number + 1))
fi

printf '{"id":"move-space","method":"workspace.move","params":{"workspace_id":"%s","insert_index":%d}}\n' \
  "$id" "$index" | nc -U "$SOCK" -w 2 >/dev/null
