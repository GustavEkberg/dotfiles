---
name: gh-dependabot
description: Review and resolve all open Dependabot PRs/alerts for the current repository. Use when triaging dependency updates, clearing Dependabot backlog, or auditing vulnerable dependencies.
---

# gh-dependabot

Review every open Dependabot PR and security alert in the current repo, then merge, close, or fix each one.

## When to Use

- Clearing the Dependabot PR backlog
- Auditing open security advisories (Dependabot alerts)
- Bulk-triaging dependency updates after long inactivity
- Pre-release dependency hygiene pass

## Prerequisites

- `gh` CLI installed
- `GH_AGENT_TOKEN` env var set (sandbox-friendly auth)
- Current directory inside a git repo with GitHub remote
- Repo has Dependabot enabled (`.github/dependabot.yml` or default alerts)

## Authentication

**Always** prefix `gh` commands with `GH_TOKEN="$GH_AGENT_TOKEN"`.

## Commands

### List open Dependabot PRs

```bash
GH_TOKEN="$GH_AGENT_TOKEN" gh pr list \
  --author "app/dependabot" \
  --state open \
  --json number,title,headRefName,labels,mergeStateStatus,statusCheckRollup,updatedAt \
  --limit 100
```

### Inspect single Dependabot PR

```bash
GH_TOKEN="$GH_AGENT_TOKEN" gh pr view <number> \
  --json title,body,headRefName,baseRefName,labels,mergeStateStatus,statusCheckRollup,files,additions,deletions
```

### List Dependabot security alerts

```bash
GH_TOKEN="$GH_AGENT_TOKEN" gh api \
  -H "Accept: application/vnd.github+json" \
  /repos/{owner}/{repo}/dependabot/alerts \
  --jq '.[] | select(.state=="open") | {number,severity:.security_advisory.severity,package:.dependency.package.name,summary:.security_advisory.summary}'
```

Requires `security_events` scope on the token.

## Scope

**Fix only.** Never close PRs or use ignore directives. GitHub auto-closes Dependabot PRs when the upgrade lands on the base branch via a merge or equivalent commit. Your job: make each PR mergeable (green CI, conflict-free) and merge it — or land the equivalent fix locally so GitHub closes the PR automatically.

## Priority Order

Always work **severity-first**. Cross-reference each open PR with its corresponding Dependabot alert(s) to determine severity, then process in this order:

1. **critical**
2. **high**
3. **medium**
4. **low**
5. **non-security** (version bumps, no advisory)

Within a severity tier, prefer:
- PRs with green CI and `CLEAN` merge state (quick wins)
- then `BEHIND` (cheap rebase)
- then red CI / `DIRTY` (manual fix)

To map PR → severity, fetch alerts and match by `dependency.package.name` + `security_advisory.identifiers[].value`. If a PR has no matching alert, treat as non-security.

## Triage Decision Tree

For each PR:

1. **Check ecosystem & semver bump** — patch/minor on lockfile-only = low risk; major = read changelog.
2. **Check CI status** — `statusCheckRollup` must be green. Red CI = investigate and fix, do not merge until green.
3. **Check `mergeStateStatus`**:
   - `CLEAN` → safe to merge
   - `BEHIND` → rebase (`gh pr comment <n> --body "@dependabot rebase"`)
   - `DIRTY` → manual conflict resolution on the dependabot branch
   - `BLOCKED` → resolve required reviews/checks
4. **Cross-check advisory** — if PR is security-driven, confirm fixed version actually addresses CVE.

## Actions

| Situation | Action |
|-----------|--------|
| Green CI, patch/minor, no breaking changes | `gh pr merge <n> --squash --delete-branch` |
| Green CI, major bump, changelog reviewed compatible | merge |
| Out of date (`BEHIND`) | `gh pr comment <n> --body "@dependabot rebase"`, wait, then merge |
| Red CI from genuine breakage | check out branch, fix code, push to dependabot branch, re-run CI, merge |
| Conflicts (`DIRTY`) | check out branch, resolve, push, merge |
| Upgrade infeasible right now | leave PR open with a comment explaining blocker — do not close |

## Dependabot Comment Commands (allowed subset)

Only use commands that **maintain or refresh** the PR:

- `@dependabot rebase` — rebase against base branch
- `@dependabot recreate` — recreate from scratch (use sparingly)
- `@dependabot merge` — merge once CI passes
- `@dependabot squash and merge`

**Do not use** `@dependabot close`, `@dependabot ignore ...`, or `gh pr close` on Dependabot PRs.

## Workflow

1. **Enumerate** — list all open Dependabot PRs and alerts.
2. **Score** — join PRs to alerts; assign each PR a severity (critical/high/medium/low/none).
3. **Sort** — order PRs by severity (critical → low → none), then by merge readiness within tier.
4. **Present plan** — show the sorted list with proposed action per PR (merge / rebase / fix). Wait for approval before bulk-merging.
5. **Execute top-down** — start with critical. Do not move to lower severity until current tier is drained or explicitly blocked.
6. **Verify** — re-list to confirm PRs auto-closed by GitHub post-merge; note any still red.
7. **Report** — final summary grouped by severity: merged N, rebased M, needs-manual-fix K (with reasons).

## Risks / Critical Notes

- **Never** mass-merge without checking CI. Green badge ≠ tests cover the upgrade surface.
- **Major bumps** in transitive deps can break runtime even with green unit tests — check integration/e2e.
- **Lockfile-only PRs** can mask breaking changes if the project doesn't pin versions properly.
- **GitHub Actions** Dependabot PRs touch `.github/workflows/` — verify pinned SHAs vs floating tags policy.
- Dependabot **alerts** (Security tab) are distinct from **PRs**. Alerts may exist without an auto-PR if Dependabot can't determine a safe upgrade path — these need manual fixes (commit lands → GitHub closes alert).
- **Never close** Dependabot PRs manually. GitHub closes them automatically when the upgrade is merged or an equivalent change lands on the base branch.

## Commit Footer

When manually fixing a Dependabot-flagged vuln, reference the advisory:

```
fix: bump <pkg> to <version> for CVE-YYYY-NNNN

Addresses GHSA-xxxx-xxxx-xxxx
```
