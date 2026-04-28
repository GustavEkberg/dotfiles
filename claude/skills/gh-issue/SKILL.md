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

- `gh` CLI installed
- `GH_AGENT_TOKEN` env var set (used for auth inside sandboxed environments)
- Current directory is within a git repo with GitHub remote

## Authentication

**Always** prefix `gh` commands with `GH_TOKEN="$GH_AGENT_TOKEN"` so the CLI picks up the correct token.

## Command

**Only** use the `--json` form with explicit fields. Plain `gh issue view` and `--comments` implicitly fetch `repository.issue.projectItems` (Projects v2) which the PAT cannot read — they fail with `Resource not accessible by personal access token`.

```bash
GH_TOKEN="$GH_AGENT_TOKEN" gh issue view <number> --json title,body,labels,assignees,state,comments,milestone,createdAt
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

### When no issue number is provided

1. **List recent issues** - Run `GH_TOKEN="$GH_AGENT_TOKEN" gh issue list --limit 10 --json number,title,labels,state,updatedAt`
2. **Present choices** - Show the list to the user and ask which issue they want to work on
3. **Continue** with the selected issue number below

### When issue number is known

1. **Fetch issue** - Get full issue details including body and comments
2. **Parse requirements** - Extract acceptance criteria, specs from issue body
3. **Check discussion** - Review comments for clarifications or changes
4. **Note labels** - Labels often indicate priority, type (bug/feature), area

## Commit Footer

When committing changes related to an issue, append `Addresses #<number>` to the commit message footer. Example:

```
feat: add retry logic for failed API calls

Addresses #42
```

## Tips

- Look for linked PRs: `GH_TOKEN="$GH_AGENT_TOKEN" gh issue view <n> --json linkedPullRequests`
