---
name: auis-attempt-fix-issue
description: Autonomously fix a GitHub issue. Use when auis (automated issue solver) invokes opencode to address an open issue. Provides workflow for analyzing, implementing, and verifying fixes without human interaction.
---

# Attempt Fix Issue

Autonomous workflow for fixing a GitHub issue. Called by `auis` (automated issue solver) which handles all git operations (branching, committing, restoring). Your job is ONLY to implement the fix.

## Critical Constraints

- **DO NOT** run any git commands (no commit, no branch, no push, no checkout, no add)
- **DO NOT** ask the user questions — you are running unattended
- **DO NOT** create PRs or interact with GitHub
- `auis` has already checked out a `fix/issue-<N>` branch for you
- `auis` will handle `git add -A && git commit` after you exit
- Focus ONLY on reading code, making changes, and running tests

## Skip Protocol

If the issue is unclear, ambiguous, impossible, or requires human input to proceed, you MUST skip it. Output exactly:

```
<issue>SKIP:reason</issue>
```

Where `reason` is a concise explanation. Examples:
- `<issue>SKIP:issue body is empty, no actionable information</issue>`
- `<issue>SKIP:requires API credentials not available in repo</issue>`
- `<issue>SKIP:ambiguous — could refer to either auth or payments module</issue>`
- `<issue>SKIP:feature request with no acceptance criteria</issue>`

**Skip when:**
- Issue body is empty or has no actionable content
- Requirements are contradictory
- Fix requires external services, secrets, or credentials you don't have
- Issue references code/files that don't exist in the repo
- Scope is too large or undefined (e.g., "refactor everything")
- You cannot determine what "done" looks like

**Do NOT skip when:**
- Issue is a clear bug with reproduction steps
- Issue describes a specific feature with clear scope
- You can infer intent even if description is terse
- The fix is straightforward even without detailed specs

## Workflow

### 1. Understand the Issue

Read the issue details provided in the prompt. Extract:
- What is broken or missing
- Where in the codebase it likely lives
- What "fixed" looks like

### 2. Read Project Context

- Read `AGENTS.md` if it exists — follow its conventions strictly
- Understand the project structure, tech stack, patterns
- Identify relevant files for the issue

### 3. Investigate

- Find the relevant code
- Understand the current behavior
- Identify root cause (for bugs) or insertion point (for features)

### 4. Implement

- Make minimal, focused changes
- Follow existing code patterns and conventions
- Keep the diff small — address only the issue, nothing else

### 5. Verify

Run ALL applicable feedback loops before finishing:

1. **Type checking** — `tsc --noEmit`, `go vet`, etc.
2. **Tests** — run the project's test suite
3. **Linting** — if configured
4. **Build** — ensure the project compiles

If any fail, fix the issues. If tests fail due to your changes, fix your implementation. If pre-existing test failures exist, ignore them (don't fix unrelated broken tests).

### 6. Summary

Before exiting, output a summary of what you did using this marker:

```
<issue>SUMMARY:
your summary here
</issue>
```

The summary should describe:
- What the root cause was (for bugs) or what was added (for features)
- What files were changed and why
- What verification was done (tests passed, build succeeded, etc.)

This is saved to `.auis/<issue#>.md` for human review. Be concise but thorough — the reviewer should understand the full scope of changes without reading the diff.

### 7. Exit

When done, simply exit. `auis` handles the rest (staging, committing, branch management).

If you made no changes (nothing to fix, or issue was invalid), output the skip marker so `auis` records it properly.
