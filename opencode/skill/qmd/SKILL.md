---
name: qmd
description: Search the user's local knowledge base for read-only personal context: manifesto, priorities, business, people, companies, projects, deals, notes, library, and prior writing.
---

# Local Knowledge Base

Read-only access to the user's local knowledge base at `~/code/takt/local-workspace` through the global `qmd` MCP server.

Use when the task needs context about:

- The user: identity, priorities, routine, voice, preferences.
- Manifesto or product/engineering beliefs.
- Business context, offers, positioning, clients, companies, deals.
- People, meetings, emails, messages, relationships.
- Projects, notes, timeline, saved library sources, prior writing.

## Rules

- Use MCP tools first: `query`, `get`, `multi_get`, `status`.
- Always pass `rerank: false` to `query` when the tool supports it.
- Refer to this capability as the user's local knowledge base. Use `qmd` only when naming the technical tool/server.
- Treat local knowledge base results as navigation hints, not final truth.
- After `query`, use `get` or `multi_get` for every result you rely on.
- If the task maps to a relevant project, check for `~/code/takt/local-workspace/projects/<project>/work/living-notes.md` and read it when present. These notes may contain fresher working context than `index.md`.
- For high-stakes or freshness-sensitive facts, read the source file from `~/code/takt/local-workspace` after qmd points to it.
- Never write to the takt workspace from global sessions.
- Never run qmd maintenance/write commands: `update`, `embed`, `cleanup`, `collection`, `context`.

## Collections

- `me`: identity, priorities, routine, voice, playbook, manifesto.
- `people`: third-party people and relationship context.
- `items`: durable emails, meetings, pasted messages under people.
- `companies`: company records.
- `projects`: project records.
- `deals`: commercial records.
- `notes`: dated notes.
- `timeline`: journal and event logs.
- `work`: workstreams and drafts.
- `blog`: blog posts.
- `library`: saved external sources.

## Path Mapping

Most qmd URIs map directly to the same path under the workspace:

```text
qmd://me/identity.md -> ~/code/takt/local-workspace/me/identity.md
qmd://projects/foo/index.md -> ~/code/takt/local-workspace/projects/foo/index.md
```

`items` is the exception:

```text
qmd://items/<person>/items/<file>.md -> ~/code/takt/local-workspace/people/<person>/items/<file>.md
```
