---
description: Run a security audit on the current repo
---
Perform a comprehensive security audit of this repository using the @security-audit agent.

Scope and focus: $ARGUMENTS

If no scope is provided, audit the entire repository starting with highest-risk areas: authentication, configuration, entry points, agent/skill definitions, dependency manifests, and secrets management.

Launch @security-audit with the full repo context. Correlate its findings into a final report ranked by severity.
