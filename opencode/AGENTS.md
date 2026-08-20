- In all interaction and commit messages, be extremely concise and sacrifice grammar for the sake of concision.
- Use English for all reasoning, communication, plans, summaries, code comments, documentation, and commit messages, regardless of the language used in user input or pasted source material such as emails. Use another language only when it is explicitly required for the task's deliverable; discuss the work in English.
- **Be critical, not agreeable**: Challenge suggestions, identify flaws, point out risks. Disagreement > false validation.
- All commit messages should follow the format: `<type>: <description>`, where `<type>` is one of the following: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`, `merge`, `build`, `ci`, `perf`, `test`, `chore`, `revert`, `merge`, `build`, `ci`, `perf`, `test`, `chore`, `revert`,
- **No Claude references in commits**: never include `Co-Authored-By` lines, AI attribution, or any mention of Claude/AI in commit messages

## Package Management

- Always use `pnpm` instead of `npm` when applicable
- Before invoking package binaries, inspect the relevant `package.json` scripts and dependencies. Prefer declared scripts; use `pnpm exec <binary>` only when that binary is installed in the relevant workspace package.
- Never silently resolve a missing binary with a global install or unpinned `pnpm dlx`. Use an existing project tool, or report the skipped check. Add a dependency only when the task requires it and after the review below.
- Before adding any dependency to `package.json`, installing a Python package locally, or using an equivalent package manager, validate and document why it is safe, actively maintained, and a standard ecosystem choice. Do not install packages that fail this review without explicit user approval.

## External Code

- **Never fetch third-party code without explicit approval first.** Applies to any network retrieval of code intended to land in the repo or run locally: `curl`/`wget` of a library, CDN/unpkg/jsDelivr bundles, `git clone`, package tarballs, binaries, install scripts. Ask before running the command, not after.
- Present the review before asking, in one short block: package + exact version, upstream repo, publisher/maintainer identity, license, last release date, download volume, and whether the source is canonical upstream or a fork.
- Name the risk shape honestly. A low-star single-maintainer fork with a large install base is a supply-chain concern worth stating, not a green light. Prefer canonical upstream over a fork unless the fork is justified.
- Always offer the no-dependency alternative and what it costs, so the choice is real.
- Once approved: pin the exact version, vendor the file, and record source URL + SHA-256 next to it. No auto-upgrade, no unpinned re-fetch.
- Vendored code is loaded attack surface. State what it can reach at runtime (network, user data, credentials) before it is accepted.

## Code Quality Standards

- Make minimal, surgical changes
- **No monolithic files**: split large files by concern; extract reusable logic into shared modules/functions; decompose past ~200 lines
- **Reusable abstractions**: common patterns belong in dedicated modules, not inlined repeatedly
- **Never compromise type safety**: No `any`, no non-null assertion operator (`!`), no type assertions (`as Type`)
- **Make illegal states unrepresentable**: Model domain with ADTs/discriminated unions; parse inputs at boundaries into typed structures; if state can't exist, code can't mishandle it
- **Abstractions**: Consciously constrained, pragmatically parameterised, doggedly documented

### **ENTROPY REMINDER**

This codebase will outlive you. Every shortcut you take becomes
someone else's burden. Every hack compounds into technical debt
that slows the whole team down.

You are not just writing code. You are shaping the future of this
project. The patterns you establish will be copied. The corners
you cut will be cut again.

**Fight entropy. Leave the codebase better than you found it.**

## Testing

- Write tests that verify semantically correct behavior
- **Failing tests are acceptable** when they expose genuine bugs and test correct behavior

## Plans

- At the end of each plan, give me a list of unresolved questions to answer, if any. Make the questions extremely concise. Sacrifice grammar for the sake of concision.
