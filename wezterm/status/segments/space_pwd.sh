# Focused herdr space and its working directory.
#
# WezTerm cannot see inside herdr -- `wezterm cli list` reports only the outer
# shell that launched it -- so herdr's socket API is the only source. One
# `pane list` call feeds both keys.

HERDR_BIN="${HERDR_BIN:-/opt/homebrew/bin/herdr}"
SPACE_PWD_MAX_WIDTH="${SPACE_PWD_MAX_WIDTH:-40}"

segment_space_pwd() {
  local panes focused workspace_id label cwd

  panes="$("$HERDR_BIN" pane list 2>/dev/null)" || return 1
  focused="$(printf '%s' "$panes" \
    | jq -c 'first(.result.panes[] | select(.focused == true))' 2>/dev/null)"
  [ -n "$focused" ] && [ "$focused" != "null" ] || return 1

  workspace_id="$(printf '%s' "$focused" | jq -r '.workspace_id // empty')"
  cwd="$(printf '%s' "$focused" | jq -r '.foreground_cwd // .cwd // empty')"

  if [ -n "$workspace_id" ]; then
    label="$("$HERDR_BIN" workspace list 2>/dev/null | jq -r --arg id "$workspace_id" \
      'first(.result.workspaces[] | select(.workspace_id == $id) | "\(.number):\(.label)")' 2>/dev/null)"
    if [ -n "$label" ] && [ "$label" != "null" ]; then
      printf 'space\t%s\n' "$label"
    fi
  fi

  if [ -n "$cwd" ]; then
    printf 'pwd\t%s\n' "$(__shorten_path "$cwd")"
  fi
}

# ~-relative, ellipsised from the left once past the width budget.
__shorten_path() {
  # Replacement held in a variable: an inline `\~` keeps its backslash under
  # bash 3.2 (/bin/bash), and a bare `~` would tilde-expand.
  local tilde='~' max="$SPACE_PWD_MAX_WIDTH"
  local path="${1/#$HOME/$tilde}"
  if [ ${#path} -gt "$max" ]; then
    printf '···%s' "${path:$(( ${#path} - max + 3 ))}"
  else
    printf '%s' "$path"
  fi
}
