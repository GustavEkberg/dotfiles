---
description: Review and resolve open Dependabot PRs and alerts
---

Triage every open Dependabot PR and security alert in the current repo.

## Step 1: Load skill

```
skill({ name: 'gh-dependabot' })
```

## Step 2: Enumerate

List open Dependabot PRs:

```bash
GH_TOKEN=$GH_AGENT_TOKEN gh pr list \
  --author "app/dependabot" \
  --state open \
  --json number,title,headRefName,labels,mergeStateStatus,statusCheckRollup,updatedAt \
  --limit 100
```

List open security alerts (may fail if token lacks `security_events` scope — degrade gracefully):

```bash
GH_TOKEN=$GH_AGENT_TOKEN gh api \
  -H "Accept: application/vnd.github+json" \
  /repos/{owner}/{repo}/dependabot/alerts \
  --jq '.[] | select(.state=="open") | {number,severity:.security_advisory.severity,package:.dependency.package.name,summary:.security_advisory.summary}'
```

If `$1` is a PR number, inspect that single PR instead and skip enumeration.

## Step 3: Score by severity and plan

Join PRs to alerts by package name. Assign each PR a severity: **critical / high / medium / low / none**.

Sort PRs by severity (critical first), then within tier by merge readiness (CLEAN → BEHIND → red CI / DIRTY).

Present the sorted table with: severity, package, semver bump, CI status, merge state, proposed action (merge / rebase / fix). Wait for user approval before executing.

Process top-down — never start lower-severity work while a higher-severity PR is unaddressed.

## Step 4: Execute approved actions

**Fix-only policy.** Never close PRs and never use `@dependabot ignore`/`@dependabot close`. GitHub auto-closes Dependabot PRs once the upgrade lands on the base branch.

Apply per-PR action from the triage table:

- merge: `gh pr merge <n> --squash --delete-branch`
- rebase: `gh pr comment <n> --body "@dependabot rebase"` (wait, recheck, merge)
- red CI: check out the dependabot branch, fix the breakage, push, wait for green, merge
- conflicts: check out, resolve, push, merge

If an upgrade is genuinely infeasible right now, leave the PR open with a comment explaining the blocker.

## Step 5: Report

Final summary:
- merged: N
- rebased (pending merge): M
- needs manual fix: K (with reasons)
- alerts without auto-PR: list with proposed manual fixes
