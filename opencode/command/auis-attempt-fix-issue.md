---
description: Autonomously fix a GitHub issue (used by auis)
argument-hint: <issue-json>
---

Autonomously fix a GitHub issue. You are running unattended via `auis` (automated issue solver). Do not ask questions. Do not run git commands.

## Step 1: Load skill

```
skill({ name: 'auis-attempt-fix-issue' })
```

## Step 2: Parse issue context

The issue details are provided as the argument below. Parse the title, body, labels, comments, and URL.

## Step 3: Execute workflow

Follow the skill's workflow:
1. Understand the issue
2. Read project context (AGENTS.md, codebase structure)
3. Investigate the relevant code
4. Implement the fix
5. Verify (tests, types, lint, build)
6. Exit cleanly — or output `<issue>SKIP:reason</issue>` if the issue cannot be addressed

Remember: NO git commands. `auis` handles branching and commits.

<user-request>
$ARGUMENTS
</user-request>
