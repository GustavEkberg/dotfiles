---
description: Review changes with parallel @code-review subagents
---
Review the code changes using THREE (3) @code-review subagents and correlate results into a summary ranked by severity. Use the provided user guidance to steer the review and focus on specific code paths, changes, and/or areas of concern.

For an interactive step-by-step review of implementation logic and tradeoffs, use `/logic-review` instead.

Guidance: $ARGUMENTS

Use git commands throughout.

Review uncommitted changes by default. If no uncommitted changes, review the last commit. If the user provides a pull request/merge request number or link, use CLI tools (gh/glab) to fetch it and then perform your review.
