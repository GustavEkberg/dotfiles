#!/usr/bin/env bash
set -euo pipefail

# port-opencode-to-claude: Port opencode/ config to ~/.claude/ Claude Code format
#
# Usage: port-opencode-to-claude [--dry-run] [--source=DIR] [--target=DIR]
#
# Maps:
#   opencode/skill/<name>/     -> ~/.claude/skills/<name>/    (full dir copy + frontmatter fixup)
#   opencode/command/<name>.md -> ~/.claude/commands/<name>.md (frontmatter translation)
#   opencode/agent/<name>.md   -> ~/.claude/agents/<name>.md   (frontmatter translation)
#   opencode/AGENTS.md         -> ~/.claude/AGENTS.md          (direct copy)
#   opencode/opencode.json     -> ~/.claude/settings.json      (permission mapping)
#
# Skips:
#   opencode/plugins/          (opencode-specific auth plugin)
#   opencode/tui.json          (opencode TUI keybinds)
#   opencode/package.json      (opencode plugin deps)
#   opencode/bun.lockb         (lockfile)
#   opencode/node_modules/     (deps)

DRY_RUN=false
SOURCE_DIR=""
TARGET_DIR="$HOME/.claude"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --source=*)
      SOURCE_DIR="${1#--source=}"
      shift
      ;;
    --target=*)
      TARGET_DIR="${1#--target=}"
      shift
      ;;
    -h|--help)
      sed -n '3,/^$/s/^# //p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

# Auto-detect source: look for opencode/ in script's parent (dotfiles repo)
if [[ -z "$SOURCE_DIR" ]]; then
  local_candidate="$(cd "$SCRIPT_DIR/.." && pwd)/opencode"
  if [[ -d "$local_candidate" ]]; then
    SOURCE_DIR="$local_candidate"
  else
    echo "error: no opencode/ dir found. Use --source=DIR" >&2
    exit 1
  fi
fi

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "error: source dir not found: $SOURCE_DIR" >&2
  exit 1
fi

# Counters
ported_skills=0
ported_commands=0
ported_agents=0
ported_other=0
skipped=0

log() {
  echo "  $1"
}

run() {
  if $DRY_RUN; then
    log "[dry-run] $1"
  else
    log "$1"
  fi
}

ensure_dir() {
  if ! $DRY_RUN; then
    mkdir -p "$1"
  fi
}

# ─── Frontmatter translation ────────────────────────────────────────────────
#
# OpenCode and Claude Code use nearly identical YAML frontmatter in SKILL.md
# and command .md files. Key differences:
#
# OpenCode agent frontmatter:
#   mode: subagent          -> Claude uses context: fork on skills, or agents/ dir
#   temperature: 0.1        -> not supported in Claude Code, strip
#   permission: { ... }     -> translate to allowed-tools
#
# OpenCode command frontmatter:
#   agent: plan             -> context: fork + agent: Plan
#
# OpenCode skill frontmatter:
#   Identical — name, description carry over directly
#
# Content rewriting:
#   skill({ name: 'foo' })  -> already works in Claude Code (Skill tool)
#   .opencode/state/        -> .claude/state/ (for complete-next-task)
#   opencode.db path        -> strip (Claude Code has no equivalent DB)
#   "opencode" references   -> "Claude Code" where appropriate

translate_command_frontmatter() {
  local file="$1"
  local content
  content=$(cat "$file")

  # Check if file has frontmatter
  if [[ "$content" != ---* ]]; then
    echo "$content"
    return
  fi

  # Extract frontmatter and body
  local frontmatter body
  frontmatter=$(echo "$content" | sed -n '1,/^---$/{ /^---$/!p; }' | tail -n +2)
  # Get everything after the second ---
  body=$(echo "$content" | sed '1,/^---$/d' | sed '1,/^---$/d')
  # But we need to handle the case where sed consumed the second ---
  # Let's use awk instead for reliability
  frontmatter=$(awk 'BEGIN{n=0} /^---$/{n++; next} n==1{print}' <<< "$content")
  body=$(awk 'BEGIN{n=0} /^---$/{n++; next} n>=2{print}' <<< "$content")

  # Translate frontmatter fields
  local new_fm=""
  local has_agent_plan=false

  while IFS= read -r line; do
    case "$line" in
      "agent: plan")
        # OpenCode's plan agent -> Claude Code's fork context with Plan agent
        new_fm+="context: fork"$'\n'
        new_fm+="agent: Plan"$'\n'
        has_agent_plan=true
        ;;
      "mode: subagent")
        # Handled differently in Claude Code — agents go in agents/ dir
        # For commands, this means context: fork
        new_fm+="context: fork"$'\n'
        ;;
      temperature:*)
        # Not supported in Claude Code, skip
        ;;
      "permission:"*)
        # Complex block — skip, handled by allowed-tools or settings.json
        # Skip until next non-indented line
        ;;
      "  "*)
        # Indented line — part of a block (permission, etc.), skip
        ;;
      *)
        # Pass through: description, argument-hint, name, etc.
        if [[ -n "$line" ]]; then
          new_fm+="$line"$'\n'
        fi
        ;;
    esac
  done <<< "$frontmatter"

  # Reassemble
  echo "---"
  echo -n "$new_fm"
  echo "---"
  echo "$body"
}

translate_agent_frontmatter() {
  local file="$1"
  local content
  content=$(cat "$file")

  if [[ "$content" != ---* ]]; then
    echo "$content"
    return
  fi

  local frontmatter body
  frontmatter=$(awk 'BEGIN{n=0} /^---$/{n++; next} n==1{print}' <<< "$content")
  body=$(awk 'BEGIN{n=0} /^---$/{n++; next} n>=2{print}' <<< "$content")

  # Build new frontmatter for Claude Code agent format
  local new_fm=""
  local in_permission_block=false
  local allowed_tools=""

  while IFS= read -r line; do
    case "$line" in
      "mode: subagent")
        # Agents are subagents by definition in Claude Code
        ;;
      temperature:*)
        # Not supported, skip
        ;;
      "permission:")
        in_permission_block=true
        ;;
      "  edit: deny")
        if $in_permission_block; then
          # Read-only agent — translate to allowed-tools
          # We'll collect bash allows below
          :
        fi
        ;;
      "  bash:")
        # Start of bash permission sub-block
        ;;
      "    \"*\": deny")
        # Default deny for bash — will add specific allows
        ;;
      "    \""*"\": allow")
        # Extract the allowed bash pattern
        local pattern
        pattern=$(echo "$line" | sed 's/.*"\(.*\)": allow/\1/')
        if [[ -n "$allowed_tools" ]]; then
          allowed_tools+=", "
        fi
        allowed_tools+="Bash($pattern)"
        ;;
      "  webfetch: allow")
        if [[ -n "$allowed_tools" ]]; then
          allowed_tools+=", "
        fi
        allowed_tools+="WebFetch"
        ;;
      "  "*)
        # Other indented permission lines, skip
        ;;
      *)
        in_permission_block=false
        if [[ -n "$line" ]]; then
          new_fm+="$line"$'\n'
        fi
        ;;
    esac
  done <<< "$frontmatter"

  # Add allowed-tools and read-only tools if we collected any
  if [[ -n "$allowed_tools" ]]; then
    # Add standard read-only tools
    allowed_tools="Read, Grep, Glob, $allowed_tools"
    new_fm+="allowed-tools: $allowed_tools"$'\n'
  fi

  echo "---"
  echo -n "$new_fm"
  echo "---"
  echo "$body"
}

rewrite_content() {
  local content="$1"

  # Replace opencode-specific references in content
  # skill({ name: 'foo' }) -> already works (Claude Code uses same Skill tool syntax)
  # .opencode/state/ -> .claude/state/
  # opencode.db -> note about no equivalent
  echo "$content" \
    | sed 's|\.opencode/state/|.claude/state/|g' \
    | sed 's|\.opencode/|.claude/|g' \
    | sed 's|\$HOME/\.local/share/opencode/opencode\.db|# Claude Code has no equivalent session DB|g' \
    | sed 's|"agent": "opencode"|"agent": "claude-code"|g'
}

# ─── Port Skills ─────────────────────────────────────────────────────────────

port_skills() {
  local skill_src="$SOURCE_DIR/skill"
  if [[ ! -d "$skill_src" ]]; then
    log "no skill/ dir found, skipping"
    return
  fi

  echo ""
  echo "Skills:"

  for skill_dir in "$skill_src"/*/; do
    local name
    name=$(basename "$skill_dir")

    # Skip empty dirs
    if [[ ! -f "$skill_dir/SKILL.md" ]]; then
      run "skip $name (no SKILL.md)"
      ((skipped++)) || true
      continue
    fi

    local dest="$TARGET_DIR/skills/$name"
    run "skill: $name -> $dest"

    if ! $DRY_RUN; then
      ensure_dir "$dest"
      # Copy entire skill directory (SKILL.md + references, scripts, assets)
      cp -R "$skill_dir"* "$dest/"

      # Rewrite content in SKILL.md
      local skill_content
      skill_content=$(rewrite_content "$(cat "$dest/SKILL.md")")
      echo "$skill_content" > "$dest/SKILL.md"
    fi

    ((ported_skills++)) || true
  done
}

# ─── Port Commands ───────────────────────────────────────────────────────────

port_commands() {
  local cmd_src="$SOURCE_DIR/command"
  if [[ ! -d "$cmd_src" ]]; then
    log "no command/ dir found, skipping"
    return
  fi

  echo ""
  echo "Commands:"

  # OpenCode-specific commands to skip
  local -a skip_commands=("pcompact-status" "pcompact-toggle")

  for cmd_file in "$cmd_src"/*.md; do
    local name
    name=$(basename "$cmd_file" .md)

    # Check skip list
    local should_skip=false
    for skip in "${skip_commands[@]}"; do
      if [[ "$name" == "$skip" ]]; then
        should_skip=true
        break
      fi
    done

    if $should_skip; then
      run "skip command: $name (opencode-specific)"
      ((skipped++)) || true
      continue
    fi

    local dest="$TARGET_DIR/commands/$name.md"
    run "command: $name -> $dest"

    if ! $DRY_RUN; then
      ensure_dir "$TARGET_DIR/commands"
      local translated
      translated=$(translate_command_frontmatter "$cmd_file")
      translated=$(rewrite_content "$translated")
      echo "$translated" > "$dest"
    fi

    ((ported_commands++)) || true
  done
}

# ─── Port Agents ─────────────────────────────────────────────────────────────

port_agents() {
  local agent_src="$SOURCE_DIR/agent"
  if [[ ! -d "$agent_src" ]]; then
    log "no agent/ dir found, skipping"
    return
  fi

  echo ""
  echo "Agents:"

  for agent_file in "$agent_src"/*.md; do
    local name
    name=$(basename "$agent_file" .md)

    local dest="$TARGET_DIR/agents/$name.md"
    run "agent: $name -> $dest"

    if ! $DRY_RUN; then
      ensure_dir "$TARGET_DIR/agents"
      local translated
      translated=$(translate_agent_frontmatter "$agent_file")
      translated=$(rewrite_content "$translated")
      echo "$translated" > "$dest"
    fi

    ((ported_agents++)) || true
  done
}

# ─── Port AGENTS.md ──────────────────────────────────────────────────────────

port_agents_md() {
  local agents_md="$SOURCE_DIR/AGENTS.md"
  if [[ ! -f "$agents_md" ]]; then
    log "no AGENTS.md found, skipping"
    return
  fi

  echo ""
  echo "AGENTS.md:"

  local dest="$TARGET_DIR/AGENTS.md"
  run "AGENTS.md -> $dest"

  if ! $DRY_RUN; then
    ensure_dir "$TARGET_DIR"
    cp "$agents_md" "$dest"
  fi

  ((ported_other++)) || true
}

# ─── Port Permissions ────────────────────────────────────────────────────────

port_permissions() {
  local config="$SOURCE_DIR/opencode.json"
  if [[ ! -f "$config" ]]; then
    log "no opencode.json found, skipping"
    return
  fi

  echo ""
  echo "Settings:"

  local dest="$TARGET_DIR/settings.json"

  # Check if settings.json already exists and has content
  if [[ -f "$dest" ]]; then
    local existing
    existing=$(cat "$dest")
    run "settings.json exists, merging permissions"
  else
    run "settings.json -> $dest (new)"
  fi

  if ! $DRY_RUN; then
    ensure_dir "$TARGET_DIR"

    # Extract deny patterns from opencode.json and convert to Claude Code format
    # Claude Code settings.json uses:
    # { "permissions": { "allow": [...], "deny": [...] } }
    #
    # OpenCode permission format:
    # { "permission": { "read": { "*.env": "deny" }, "bash": { "pattern": "deny" } } }

    local deny_rules=()

    # Parse read denies — Claude Code doesn't have granular read deny,
    # but we can note them
    # Parse bash denies
    if command -v jq &>/dev/null; then
      # Use jq if available (opencode.json has trailing comma, strip it)
      local clean_json
      clean_json=$(perl -p0e 's/,(\s*[}\]])/\1/g' "$config")

      # Extract bash deny patterns
      while IFS= read -r pattern; do
        if [[ -n "$pattern" && "$pattern" != "null" ]]; then
          deny_rules+=("Bash($pattern)")
        fi
      done < <(echo "$clean_json" | jq -r '.permission.bash // {} | to_entries[] | select(.value == "deny") | .key')

      # Build settings.json
      local existing_settings="{}"
      if [[ -f "$dest" ]]; then
        existing_settings=$(cat "$dest")
      fi

      # Merge: keep existing settings, add/update permissions.deny
      local deny_json="[]"
      if [[ ${#deny_rules[@]} -gt 0 ]]; then
        deny_json=$(printf '%s\n' "${deny_rules[@]}" | jq -R . | jq -s .)
      fi

      echo "$existing_settings" | jq --argjson deny "$deny_json" '
        .permissions = (.permissions // {}) |
        .permissions.deny = ((.permissions.deny // []) + $deny | unique)
      ' > "$dest"

    else
      # Fallback: manual parse (less robust)
      log "warning: jq not found, writing basic settings"

      local deny_json=""
      # Grep for deny patterns in bash section
      local in_bash=false
      while IFS= read -r line; do
        if [[ "$line" == *'"bash"'* ]]; then
          in_bash=true
          continue
        fi
        if $in_bash && [[ "$line" == *"}"* ]]; then
          in_bash=false
          continue
        fi
        if $in_bash && [[ "$line" == *'"deny"'* ]]; then
          local pattern
          pattern=$(echo "$line" | sed 's/.*"\([^"]*\)"\s*:\s*"deny".*/\1/')
          if [[ -n "$deny_json" ]]; then
            deny_json+=","
          fi
          deny_json+="\"Bash($pattern)\""
        fi
      done < "$config"

      if [[ -f "$dest" ]]; then
        # Crude merge — append deny rules
        local existing
        existing=$(cat "$dest")
        echo "$existing" | sed "s/}$/,\"permissions\":{\"deny\":[$deny_json]}}/" > "$dest"
      else
        echo "{\"permissions\":{\"deny\":[$deny_json]}}" > "$dest"
      fi
    fi
  fi

  ((ported_other++)) || true
}

# ─── Main ────────────────────────────────────────────────────────────────────

echo "Porting opencode -> Claude Code"
echo "  source: $SOURCE_DIR"
echo "  target: $TARGET_DIR"
if $DRY_RUN; then
  echo "  mode:   DRY RUN"
fi

port_agents_md
port_skills
port_commands
port_agents
port_permissions

echo ""
echo "Done:"
echo "  skills:   $ported_skills"
echo "  commands: $ported_commands"
echo "  agents:   $ported_agents"
echo "  other:    $ported_other"
echo "  skipped:  $skipped"

if $DRY_RUN; then
  echo ""
  echo "Re-run without --dry-run to apply."
fi
