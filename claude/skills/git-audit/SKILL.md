---
name: git-audit
description: Audit an unfamiliar codebase via git history (churn, contributors, bug hotspots, velocity, firefighting) and write findings to docs/CODEBASE_AUDIT.md. Use when onboarding to a new repo, before reviewing unfamiliar code, or when asked for a "codebase audit", "repo recon", or "git audit".
---

# git-audit

Run five git diagnostics against the current repo, synthesize the results, and write a structured audit to `docs/CODEBASE_AUDIT.md`. Based on https://piechowski.io/post/git-commands-before-reading-code/.

## When to use

- Onboarding to an unfamiliar repo
- Pre-review of code you don't own
- "What's risky here?" / "Where should I start reading?" questions

## Prerequisites

- cwd inside a git repo with commit history
- `git` available

## Workflow

### 1. Verify repo + capture metadata

```bash
git rev-parse --show-toplevel              # repo root
git rev-parse --abbrev-ref HEAD            # current branch
git log -1 --format='%h %ad' --date=short  # HEAD short-sha + date
git rev-list --count HEAD                  # total commits
git rev-parse --is-shallow-repository      # shallow? warn if true
basename "$(git rev-parse --show-toplevel)" # repo name
```

If not in a git repo, abort with a clear error.
If shallow, include a warning in the output header — results will be incomplete.

### 2. Run the 5 diagnostics

Run each command exactly as written. Capture stdout for embedding in the report.

```bash
# 1. Churn — top 20 most-changed files in last year
git log --format=format: --name-only --since="1 year ago" | sort | uniq -c | sort -nr | head -20

# 2. Contributors — bus factor signal
# (HEAD arg is required — without it, shortlog reads stdin and produces no
# output in non-TTY contexts like agent shells.)
git shortlog -sn --no-merges HEAD

# 3. Bug hotspots — files touched by fix/bug commits (full history)
git log -i -E --grep="fix|bug|broken" --name-only --format='' | sort | uniq -c | sort -nr | head -20

# 4. Velocity — commits per month, full history
git log --format='%ad' --date=format:'%Y-%m' | sort | uniq -c

# 5. Firefighting — reverts/hotfixes/rollbacks in last year
git log --oneline --since="1 year ago" | grep -iE 'revert|hotfix|emergency|rollback'
```

Command 5 exits non-zero when grep finds nothing — that's fine, treat empty as "None".

### 3. Synthesize

Ground every claim in the data. No speculation.

- **Highest-risk files** — intersect churn (cmd 1) with hotspots (cmd 3). Files in both lists are top risk.
- **Bus factor** — count contributors holding >5% of commits. Flag if ≤2. Note if top contributors look inactive (cross-check with recent commits if needed).
- **Velocity trend** — compare last 3 months to prior 12-month average. Call out: accelerating / steady / decelerating / dormant. Note multi-month gaps.
- **Firefighting rate** — `count(reverts last year) / count(commits last year)`. Flag if >2%.

If a signal is missing (small repo, no fix commits, shallow clone), say so explicitly rather than inventing a read.

### 4. Write `docs/CODEBASE_AUDIT.md`

- Create `docs/` if missing.
- If the file exists and is non-empty, show the user its first few lines and ask before overwriting.
- Use the template below.

## Output template

````markdown
# Codebase Audit — <repo-name>

Generated: <YYYY-MM-DD> · Branch: <branch> · HEAD: <short-sha> · Total commits: <n>
<!-- if shallow: > ⚠ Shallow clone — results incomplete. Run `git fetch --unshallow` for full history. -->

## TL;DR

- **Highest-risk files:** <top 3-5 from churn × hotspots intersection>
- **Bus factor:** <n> contributors hold <pct>% of commits — <read>
- **Velocity:** <accelerating | steady | decelerating | dormant> — <evidence>
- **Firefighting rate:** <pct>% of last-year commits are reverts/hotfixes — <read>

## 1. Churn — most-changed files (last year)

```
<raw output of cmd 1>
```

**Read:** <2-4 sentences>

## 2. Contributors

```
<raw output of cmd 2>
```

**Read:** <bus factor, concentration, active vs departed>

## 3. Bug hotspots

```
<raw output of cmd 3, or "None">
```

**Read:** <which files keep breaking; overlap with churn>

## 4. Velocity (commits/month)

```
<raw output of cmd 4>
```

**Read:** <trend, gaps, recent direction>

## 5. Firefighting (reverts/hotfixes, last year)

```
<raw output of cmd 5, or "None">
```

**Read:** <stability signal>

## Recommended reading order

1. <file> — <why>
2. <file> — <why>
3. <file> — <why>
````

## Notes

- All commands are read-only — run them without confirmation.
- Empty command output → write `None` in the block, don't leave it blank.
- Don't fabricate findings. Thin data → say "insufficient history" in the relevant section.
- Keep "Read" sections short (2-4 sentences). The raw data carries the weight.
