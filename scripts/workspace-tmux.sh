#!/usr/bin/env bash
set -euo pipefail

# Edit this block to change the default tmux workspace.
SESSION="main"
WORKSPACES=(
  "0:takt:$HOME/code/takt:split"
  "1:local-workspace:$HOME/code/takt/local-workspace:split"
  "2:dp:$HOME/code/nigel/dp:split"
  "3:rebuild:$HOME/code/imvi/rebuild:split"
  "4:dotfiles:$HOME/code/dotfiles:split"
  "9:home:$HOME:shell"
)
RIGHT_CMD="la"

usage() {
  printf 'Usage: %s\n' "${0##*/}"
  printf 'Creates tmux session %s if missing, otherwise attaches.\n' "$SESSION"
}

attach_session() {
  if [[ -n "${TMUX:-}" ]]; then
    tmux switch-client -t "$SESSION"
  else
    tmux attach-session -t "$SESSION"
  fi
}

require_dir() {
  local dir=$1

  if [[ ! -d "$dir" ]]; then
    printf 'Missing workspace dir: %s\n' "$dir" >&2
    exit 1
  fi
}

create_window() {
  local index=$1
  local name=$2
  local dir=$3
  local layout=$4

  if [[ "$index" == "0" ]]; then
    tmux rename-window -t "$SESSION:0" "$name"
  else
    tmux new-window -t "$SESSION:$index" -n "$name" -c "$dir"
  fi

  if [[ "$layout" == "split" ]]; then
    tmux split-window -h -t "$SESSION:$name" -c "$dir" "$RIGHT_CMD"
    tmux select-pane -t "$SESSION:$name.0"
  fi
}

main() {
  if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    usage
    exit 0
  fi

  if tmux has-session -t "$SESSION" 2>/dev/null; then
    attach_session
    exit 0
  fi

  local dir_layout
  for workspace in "${WORKSPACES[@]}"; do
    dir_layout=${workspace#*:*:}
    require_dir "${dir_layout%:*}"
  done

  local first=${WORKSPACES[0]}
  local first_rest=${first#*:}
  local first_name=${first_rest%%:*}
  local first_dir_layout=${first_rest#*:}
  local first_dir=${first_dir_layout%:*}
  tmux new-session -d -s "$SESSION" -n "$first_name" -c "$first_dir"

  local index name dir layout rest
  for workspace in "${WORKSPACES[@]}"; do
    index=${workspace%%:*}
    rest=${workspace#*:}
    name=${rest%%:*}
    dir_layout=${rest#*:}
    dir=${dir_layout%:*}
    layout=${dir_layout##*:}
    create_window "$index" "$name" "$dir" "$layout"
  done

  tmux select-window -t "$SESSION:${WORKSPACES[0]%%:*}"
  attach_session
}

main "$@"
