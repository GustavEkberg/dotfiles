---
description: Fetch GitHub issue and start working on it
---

Fetch GitHub issue #$1 and begin addressing it.

## Step 1: Load skill

```
skill({ name: 'gh-issue' })
```

## Step 2: Fetch issue

```bash
GH_TOKEN=$GH_AGENT_TOKEN gh issue view $1 --json title,body,state,labels,assignees,comments,milestone
```

## Step 3: Analyze and clarify

Provide a brief summary:
- **Title**: issue title
- **State**: open/closed
- **Labels**: relevant labels
- **Requirements**: extract from body and comments

Then identify any ambiguities, gaps, or unknowns. Ask clarifying questions before proceeding:
- Where in the codebase is this located?
- Missing acceptance criteria?
- Unclear scope or edge cases?
- Implementation approach options?
- Dependencies or blockers?

Do NOT start implementation until clarifying questions are answered.

<issue-number>$1</issue-number>
