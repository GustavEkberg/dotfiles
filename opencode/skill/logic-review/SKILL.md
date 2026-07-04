---
name: logic-review
description: Review uncommitted changes or a recent commit by walking through implementation logic step by step. Use when the user wants to discuss why a solution was implemented piece by piece before commit or after a specific commit.
---

# Logic Review

Use this for an interactive implementation review, not a conventional code review. The goal is to help the user understand and challenge the logic behind a change before committing, or to inspect the reasoning in a specific recent commit.

## Scope

Focus on:

- What problem the change appears to solve.
- How each changed piece contributes to that solution.
- Whether the implementation order and decomposition make sense.
- Hidden assumptions, coupling, state transitions, and behavioral edge cases.
- Simpler alternatives or suspicious complexity.

Do not focus on:

- Security audit findings unless they directly affect the implementation logic.
- Test coverage review unless a missing test reveals an unclear behavior contract.
- Style nits, formatting, naming bikesheds, or generic best-practice advice.
- Severity-ranked findings summaries.

## Inputs

Default target:

1. Review uncommitted changes first.
2. If no uncommitted changes exist, review `HEAD`.
3. If the user names a commit, range, branch, file, or path, review that target.

Treat untracked files from `git status --short` as uncommitted changes; `git diff` will not show them by itself.

Useful commands:

```sh
git status --short
git diff --stat
git diff
git show --stat --oneline --decorate <commit>
git show <commit>
git log --oneline -10
```

Use read/search tools for full file context after identifying changed files. Do not rely on diff hunks alone when behavior depends on surrounding code.

## Workflow

### 1. Establish Target

Identify the exact target being reviewed. State it briefly:

```text
Reviewing uncommitted changes in 4 files.
```

or:

```text
Reviewing commit abc1234: feat: add billing sync
```

If the target is ambiguous, ask one short clarification before reviewing.

### 2. Build The Change Map

Create a short initial summary of the change, then a terse map of changed files and their apparent role. Keep this brief; the detailed reasoning belongs in the step-by-step walkthrough.

```text
Initial summary: adds order cancellation by modeling the state, enforcing the transition server-side, and exposing it in the UI.
```

Then map the files:

```text
Change map:
- src/domain/order.ts: adds cancellation state transition
- src/api/orders.ts: exposes cancel endpoint
- src/ui/order-actions.tsx: wires cancel action into UI
```

Keep this factual. Do not judge yet.

### 3. Reconstruct The Solution

Explain the implementation as a short sequence of decisions, from intent to effect. Do not fully review each decision yet:

```text
I read the solution as:
1. Model cancellation as an explicit order state.
2. Reject cancellation after fulfillment.
3. Expose a mutation that enforces the state rule.
4. Add UI that only calls the mutation for cancellable orders.
```

If intent is unclear, say so and ask the user to confirm before continuing.

### 4. Walk One Piece At A Time

Review one logical piece at a time. Default to pausing after each piece even if the user did not explicitly ask for interactivity. The user should understand the whole change by understanding the code-backed parts that make it up. For each piece:

1. Point to exact files/functions.
2. Explain what changed.
3. Explain why it likely exists in the solution.
4. Challenge the logic with one or two concrete questions or risks.
5. Pause for discussion before moving on.

Use this format:

```text
Piece 1: Domain state
Files: src/domain/order.ts

What changed: ...
Why it exists: ...
Logic check: ...

Question: should cancellation be impossible after fulfillment, or should it create a refund workflow instead?
```

Wait for the user's response after each piece unless they explicitly ask for the whole review in one pass or ask to skip to the final summary.

### 5. Challenge The Shape

After the piece-by-piece pass, discuss the implementation shape:

- Is the logic in the right layer?
- Are invariants centralized or duplicated?
- Does data flow one way, or are there circular assumptions?
- Is the change too broad for the behavior it adds?
- Is there a smaller design that preserves the same outcome?
- Did the solution introduce a new concept without naming it clearly?

Be critical. Prefer concrete tradeoffs over vague approval.

### 6. End With Decisions

Before ending, verify every changed file from the change map was either discussed directly or explicitly marked as incidental/supporting.

Finish with the current review state:

```text
Decisions:
- Keep explicit cancellation state.
- Move fulfillment guard from UI into domain mutation.
- Rename "void" to "cancel" because accounting voiding is different.

Open questions:
- Should cancelled orders emit an event?
```

Never commit, stage, amend, or push during a logic review unless the user explicitly asks for that git action. If the user asks for edits, make only the discussed changes.

## Interaction Rules

- Ask one question at a time during the walkthrough.
- Do not dump a full findings report unless requested.
- Do not launch parallel review agents; this skill is for direct discussion.
- Keep the discussion code-focused; use the changed code and surrounding context as the base for every claim.
- Prefer short, concrete claims backed by code references.
- If you infer intent, label it as inference.
- If the code contradicts the apparent intent, stop and surface that contradiction.
- If the user says "continue", proceed to the next piece.
- If the user asks to skip ahead, stop the walkthrough and produce the final decisions/open questions summary from the pieces reviewed so far.
