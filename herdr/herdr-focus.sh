#!/usr/bin/env bash
# Focus the Nth space (by workspace number) or Nth agent (by list order).
# herdr's indexed bindings only accept 1..9, so the keyboard rows bound in
# herdr/config.toml (prefix+0..5, shift+F1..F5) route through here instead.
# usage: herdr-focus.sh workspace|agent N   (workspace also accepts "last")
set -euo pipefail

HERDR="${HERDR_BIN:-/opt/homebrew/bin/herdr}"
JQ="${JQ_BIN:-/usr/bin/jq}"

kind="${1:-}"
index="${2:-}"
[ -n "$kind" ] && [ -n "$index" ] || { echo "usage: herdr-focus.sh workspace|agent N" >&2; exit 2; }

case "$kind" in
  workspace)
    if [ "$index" = "last" ]; then
      id=$("$HERDR" workspace list | "$JQ" -r '.result.workspaces | max_by(.number).workspace_id // empty')
    else
      id=$("$HERDR" workspace list | "$JQ" -r --argjson n "$index" '.result.workspaces[] | select(.number == $n) | .workspace_id')
    fi
    [ -n "$id" ] || exit 0
    exec "$HERDR" workspace focus "$id"
    ;;
  agent)
    id=$("$HERDR" agent list | "$JQ" -r --argjson n "$index" '.result.agents[$n - 1].pane_id // empty')
    [ -n "$id" ] || exit 0
    exec "$HERDR" agent focus "$id"
    ;;
  *)
    echo "unknown kind: $kind" >&2
    exit 2
    ;;
esac
