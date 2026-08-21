---
description: Capture a thought for later, or work through the queue
argument-hint: [<thought> | run | clear]
---

Deferred-work queue for the current project.

Zero-cost capture is the `later` fish function (`fish/config.fish`) — `later "the thought"` from any shell appends instantly with no model in the loop. This command does the same thing from inside a session, plus the draining.

Arguments: `$ARGUMENTS`

## Step 1: Resolve the queue file

```bash
root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
slug=$(printf '%s' "$root" | sed 's|^/||; s|/|-|g')
dir="$HOME/.local/share/opencode/later"
file="$dir/$slug.md"
mkdir -p "$dir"
[ -f "$file" ] || printf '# Later — %s\n\n' "$root" > "$file"
```

Git root keying means sessions started in subdirectories share one queue.

## Step 2: Dispatch on arguments

| Arguments | Action |
|---|---|
| empty | **list** — print outstanding items, do nothing else |
| `run` | **run** — work through the queue |
| `clear` | print what is queued, then truncate the file back to its header line. No work done. |
| anything else | **add** — the arguments are the thought to capture |

`run` and `clear` are the only reserved words. Everything else is a thought, taken verbatim.

## add

Append one line, then stop:

```bash
printf -- '- %s %s\n' "$(date +%F)" 'THOUGHT'
```

Substitute the thought as a single-quoted bash literal, redirected `>> "$file"`. If it contains a single quote, use the Edit tool on `$file` instead — that path is already allowed in `permission.edit`.

Confirm in **one short line**. Do not analyse the thought, do not look up the code, do not offer to do it now. Deferring is the whole point.

## run

1. If the queue is missing or holds no `- ` items, say so in one line and stop.
2. Print the outstanding items, numbered, oldest first.
3. Work them top-down, one at a time.
   - A one-line note from days ago is not a spec. If an item is ambiguous, or the work is destructive, ask before starting it.
   - Check the item is still relevant — the code may have moved since it was written.
4. Delete that item's line from the file **immediately** after its work lands, before starting the next one. Never batch deletions to the end: an interrupted run must not re-run finished work or lose the remaining items.
5. If an item turns out to be wrong, obsolete, or already done: say why and **keep the line**. Only completed work is deleted; dropping the rest is the user's call.
6. Report at the end: what was done, what remains and why.
