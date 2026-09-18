---
name: local-knowledge
description: "Read the user's local knowledge base for personal and business context. Use when resolving a repository's project context, consulting prior knowledge, or suggesting living-note updates from meaningful work."
---

# Local Knowledge Base

Read-only access to the user's local knowledge base at `~/code/takt/local-workspace` through the global `qmd` MCP server.

The qmd SQLite index is ignored per-computer cache state. Workspace hooks rebuild it asynchronously with the pinned local builder after indexed Git changes; it is not stored in Git.

Use when the task needs context about:

- The user: identity, priorities, routine, voice, preferences.
- Manifesto or product/engineering beliefs.
- Business context, offers, positioning, clients, companies, deals.
- People, meetings, emails, messages, relationships.
- Projects, notes, timeline, saved library sources, prior writing.

## Rules

- Use MCP tools first for discovery: `query`, `get`, `multi_get`, `status`. Read exact paths from the project mapping below directly.
- Always pass `rerank: false` to `query` when the tool supports it.
- Refer to this capability as the user's local knowledge base. Use `qmd` only when naming the technical tool/server.
- Treat local knowledge base results as navigation hints, not final truth.
- After `query`, use `get` or `multi_get` for every result you rely on.
- If the task maps to a relevant project, check for `~/code/takt/local-workspace/projects/<project>/work/living-notes.md` and read it when present. These notes may contain fresher working context than `index.md`.
- For high-stakes or freshness-sensitive facts, read the source file from `~/code/takt/local-workspace` after qmd points to it.
- Never write to the takt workspace from global sessions.
- Never run qmd maintenance/write commands: `update`, `embed`, `cleanup`, `collection`, `context`.
- If `status` fails, reports an empty index, or a rebuild is in progress, fall back to direct source reads under `~/code/takt/local-workspace`; never block the task on qmd.

## Repository Project Context

At the start of repository work, check `~/code/takt/local-workspace/.agent/local-references.json` when available. Its `references` entries map local `path` values to `projectId` values.

1. Match the canonical repository root to the unique most-specific enclosing reference path, using directory boundaries. For a linked Git worktree, also resolve its main checkout. If the manifest is missing, unusable, has no match, or is ambiguous, continue without guessing a project from its name.
2. For a match, read `projects/<projectId>/index.md` and `projects/<projectId>/work/living-notes.md` under `~/code/takt/local-workspace` when present. Read the current source files rather than relying on indexed copies.
3. Resolve the project's `companyIds` to `companies/<companyId>/index.md`; read relevant company context when needed. Keep these exact source paths available for follow-up reads and suggestions.
4. Use QMD for additional conversations, decisions, or background. Missing mappings or files must not block repository work.

## Living-Note Suggestions

While working on a mapped or explicitly identified project, notice information worth carrying into the user's next planning or client review:

- A client agreement or clarification of why a result matters.
- A meaningful decision, tradeoff, discovery, or blocker affecting the product work.
- Evidence that an existing note is stale, contradicted, or missing important context.

Before suggesting an update, read the existing living notes and check whether the information is already captured. Propose only the smallest useful addition or correction; preserve the user's wording and judgment. Distinguish confirmed agreements and observations from proposals or open questions. Code changes alone do not establish client value, agreement, or completion.

At a natural stopping point, group useful updates into one concise `Living-note suggestion: <exact workspace path>` with ready-to-save wording and a brief reason. If the file is absent, propose the first note at `projects/<projectId>/work/living-notes.md`. Skip routine implementation details and unchanged context; do not require a recap after every session or repeat an unanswered suggestion unless new evidence changes it.

Keep suggestions in the conversation for the user's workspace review. The global-session read-only rule still applies; a suggestion is not a saved update.

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
