---
name: complete-next-task
description: Complete one incomplete task from a PRD. Pick the next logical task with `passes: false`, implement it, run feedback loops, and commit. Use when the user invokes `/skill:complete-next-task <prd-name>` or asks to work through a PRD task list.
---

# complete-next-task

Complete one incomplete task from a PRD. Pick the next logical task with `passes: false`, implement it, run feedback loops, commit.

Per pi skill invocation convention, arguments passed after `/skill:complete-next-task` are appended as `User: <args>`. The argument is the `<prd-name>`.

## File Locations

The `.prd/state/` directory may not be at cwd. Search for it:

1. Start at cwd
2. Check if `.prd/state/<prd-name>/prd.json` exists
3. If not, go up one directory
4. Repeat until found or reaching filesystem root

```bash
find_prd_state() {
  local prd="$1"
  local dir="$PWD"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/.prd/state/$prd/prd.json" ]]; then
      echo "$dir/.prd/state/$prd"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}
```

Use **absolute paths** for all file operations once found:

```
<state-dir>/
├── prd.json       # Task list with passes field
└── progress.txt   # Cross-iteration memory
```

## Process

### 1. Get Bearings

- Read progress file — **CHECK 'Codebase Patterns' SECTION FIRST**
- Read PRD — find next task with `passes: false`
  - **Task Priority** (highest to lowest):
    1. Architecture/core abstractions
    2. Integration points
    3. Spikes/unknowns
    4. Standard features
    5. Polish/cleanup
- Check recent history: `git log --oneline -10`

### 2. Initialize Progress (if needed)

If progress.txt doesn't exist, create it:

```markdown
# Progress Log

PRD: <prdName from PRD>
Started: <YYYY-MM-DD>

## Codebase Patterns

<!-- Consolidate reusable patterns here -->


<!-- Task logs below - APPEND ONLY -->
```

### 3. Branch Setup

**One branch per PRD.** All tasks commit to the same branch. Do NOT create a new branch per task.

Extract `prdName` from PRD, then:

- `git checkout <prdName> 2>/dev/null || git checkout -b <prdName>`

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

Set the task's `passes` field to `true`. Capture session metrics in a `completedAt` object — best-effort, harness-dependent. Under pi, the session DB equivalent is not exposed; populate only `timestamp`:

```json
{
  "passes": true,
  "completedAt": {
    "timestamp": "<ISO 8601 UTC>"
  }
}
```

- `timestamp`: Current time in ISO 8601 UTC (e.g. `"2026-04-15T12:34:56Z"`) — always required

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

- `git add -A && git commit -m 'feat(<scope>): <description>'`

All commits land on the single PRD branch. One branch, many commits.

## Completion

If all tasks have `passes: true`, output:

```
<tasks>COMPLETE</tasks>
```

## Philosophy

This codebase will outlive you. Every shortcut becomes someone else's burden. Patterns you establish will be copied. Corners you cut will be cut again.

Fight entropy. Leave the codebase better than you found it.
