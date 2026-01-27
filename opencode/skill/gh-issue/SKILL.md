---
name: gh-issue
description: Fetch and analyze GitHub issues from the current repository. Use when needing issue context, understanding requirements from an issue, or working on issue-driven development.
---

# gh-issue

Fetch GitHub issue details for the repository in the current working directory.

## When to Use

- Need to understand requirements from a GitHub issue
- Starting work on an issue and need full context
- Analyzing issue comments/discussion for implementation details
- Checking issue labels, assignees, or milestone

## Prerequisites

- `gh` CLI installed and authenticated
- Current directory is within a git repo with GitHub remote

## Commands

```bash
# View issue with full details
gh issue view <number>

# View with comments
gh issue view <number> --comments

# JSON output for parsing
gh issue view <number> --json title,body,labels,assignees,state,comments
```

## Output Fields

| Field | Description |
|-------|-------------|
| `title` | Issue title |
| `body` | Issue description (markdown) |
| `state` | open/closed |
| `labels` | Array of label names |
| `assignees` | Array of assigned users |
| `comments` | Discussion thread |
| `milestone` | Associated milestone |
| `createdAt` | Creation timestamp |

## Workflow

1. **Fetch issue** - Get full issue details including body and comments
2. **Parse requirements** - Extract acceptance criteria, specs from issue body
3. **Check discussion** - Review comments for clarifications or changes
4. **Note labels** - Labels often indicate priority, type (bug/feature), area

## Tips

- Look for linked PRs: `gh issue view <n> --json linkedPullRequests`
