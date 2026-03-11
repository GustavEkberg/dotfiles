---
description: Complete the next incomplete task from a PRD
---

Complete one task from a PRD file. Pick the next logical task to work on (should have `passes: false`) Implement the task, run feedback loops, and commit.

## Usage

```
/complete-next-task <prd-name>
```

Where `<prd-name>` matches `.opencode/state/<prd-name>/prd.json`

## Before Starting

First, invoke the skill tool to detect the VCS:

```
skill({ name: 'vcs-detect' })
```

Use the detected VCS (jj or git) for all version control operations.

## File Locations

**IMPORTANT**: The `.opencode/state/` directory may not be at cwd. Search for it:

1. Start at cwd
2. Check if `.opencode/state/<prd-name>/prd.json` exists
3. If not, go up one directory
4. Repeat until found or reaching filesystem root

Use this bash to find the state directory:

```bash
find_opencode_state() {
  local prd="$1"
  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/.opencode/state/$prd/prd.json" ]]; then
      echo "$dir/.opencode/state/$prd"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}
```

Once found, use **absolute paths** for all file operations:

```
<state-dir>/
├── prd.json       # Task list with passes field
└── progress.txt   # Cross-iteration memory
```

## Process

### 1. Get Bearings

- Read progress file - **CHECK 'Codebase Patterns' SECTION FIRST**
- Read PRD - find next task with `passes: false`
  - **Task Priority** (highest to lowest):
    1. Architecture/core abstractions
    2. Integration points
    3. Spikes/unknowns
    4. Standard features
    5. Polish/cleanup
- Check recent history (jj: `jj log --limit 10`, git: `git log --oneline -10`)

### 2. Initialize Progress (if needed)

If progress.txt doesn't exist, create it:

```markdown
# Progress Log

PRD: <prdName from PRD>
Started: <YYYY-MM-DD>

## Codebase Patterns

<!-- Consolidate reusable patterns here -->

---

<!-- Task logs below - APPEND ONLY -->
```

### 3. Branch Setup

**One branch per PRD.** All tasks commit to the same branch. Do NOT create a new branch per task.

Extract `prdName` from PRD, then:

- jj: Check if already on a change for this PRD (`jj log --limit 1`). If not, `jj new -m '<prdName>'`
- git: `git checkout <prdName> 2>/dev/null || git checkout -b <prdName>` — switch to existing branch, only create if it doesn't exist

### 4. Implement Task

Work on the single task until verification steps pass.

### 5. Feedback Loops (REQUIRED)

Before committing, run ALL applicable:

- Type checking
- Tests
- Linting
- Formatting

**Do NOT commit if any fail.** Fix issues first.

### 6. Update PRD

Set the task's `passes` field to `true` in the PRD file.

Also capture session metrics and write a `completedAt` object on the task. Query the opencode SQLite DB to get stats for the current session (including subagent sessions):

```bash
OPENCODE_DB="$HOME/.local/share/opencode/opencode.db"
CURRENT_SESSION=$(sqlite3 "$OPENCODE_DB" "SELECT id FROM session WHERE parent_id IS NULL ORDER BY time_created DESC LIMIT 1")
sqlite3 "$OPENCODE_DB" "
  WITH session_tree AS (
    SELECT id FROM session WHERE id = '$CURRENT_SESSION'
    UNION ALL
    SELECT s.id FROM session s
    JOIN session_tree st ON s.parent_id = st.id
  )
  SELECT
    COUNT(*) as messages,
    COALESCE(SUM(json_extract(data,'$.tokens.total')), 0) as tokens,
    MIN(m.time_created) as started,
    MAX(m.time_created) as ended
  FROM message m
  JOIN session_tree st ON m.session_id = st.id
  WHERE json_extract(data,'$.role') = 'assistant'
"
```

Use the query results to add `completedAt` to the task object alongside `passes: true`:

```json
{
  "passes": true,
  "completedAt": {
    "timestamp": "<ISO 8601 UTC>",
    "tokens": <total from query>,
    "messages": <messages from query>,
    "durationSec": <ended - started>
  }
}
```

- `timestamp`: Current time in ISO 8601 UTC (e.g. `"2026-03-09T12:34:56Z"`)
- `tokens`: Total tokens consumed across session + subagents (reflects full computational cost)
- `messages`: Number of assistant messages (turns of work)
- `durationSec`: Wall-clock seconds from first to last message

### 7. Update Progress

Append to progress.txt:

```markdown
## Task - [task.id]

- What was implemented
- Files changed
- **Learnings:** patterns, gotchas
```

If you discover a **reusable pattern**, also add to `## Codebase Patterns` at the TOP.

### 8. Commit

- jj: `jj describe -m 'feat(<scope>): <description>' && jj new`
- git: `git add -A && git commit -m 'feat(<scope>): <description>'`

All commits land on the single PRD branch. One branch, many commits.

## Completion

If all tasks have `passes: true`, output:

```
<tasks>COMPLETE</tasks>
```

## Philosophy

This codebase will outlive you. Every shortcut becomes someone else's burden. Patterns you establish will be copied. Corners you cut will be cut again.

Fight entropy. Leave the codebase better than you found it.

<user-request>
$ARGUMENTS
</user-request>
