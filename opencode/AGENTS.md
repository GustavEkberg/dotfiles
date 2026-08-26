## Communication

- For human-facing text, use the fewest words that preserve meaning and precision. Choose each word deliberately; remove filler.
- State evidence, risks, and disagreement directly. Avoid praise, superlatives, and reflexive validation.
- Challenge suggestions and identify flaws. Prefer honest disagreement over false agreement.
- Use English for communication, plans, summaries, comments, documentation, and commits. Use another language only when the deliverable requires it; discuss the work in English.

## Commits

- Use `<type>: <description>`, where `<type>` is `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`, `merge`, `build`, or `ci`.
- Never add `Co-Authored-By`, AI attribution, or AI references.

## Package Management

- Always use `pnpm` instead of `npm` when applicable
- Before invoking package binaries, inspect the relevant `package.json` scripts and dependencies. Prefer declared scripts; use `pnpm exec <binary>` only when that binary is installed in the relevant workspace package.
- Never silently resolve a missing binary with a global install or unpinned `pnpm dlx`. Use an existing project tool, or report the skipped check. Add a dependency only when the task requires it and after the review below.
- Before adding or installing a dependency, review its exact version, canonical repository, maintainer, license, last release, adoption when meaningful, and supply-chain risk. Offer the no-dependency alternative and its cost. Get explicit approval.
- Pin direct dependencies exactly and commit the package manager's lockfile. Do not vendor package-manager dependencies.

## External Code

- Get explicit approval before fetching third-party source, binaries, or install scripts that will be committed or executed locally.
- Before asking, report the immutable version or commit, canonical source, maintainer, license, release date, adoption when meaningful, fork status, supply-chain risk, and runtime access to network, user data, or credentials.
- Prefer canonical upstream sources. Explain any fork choice and offer a no-dependency alternative with its cost.
- For manually downloaded or vendored assets, record the immutable source URL and SHA-256 beside the asset. Never auto-upgrade or re-fetch an unpinned source.

## Web Tools

- Use `webfetch` for external web research, search-result retrieval, documentation, and scraping.
- Use browser control only to validate or interact with locally running development work. Do not use it as a fallback for ordinary external fetching or scraping.

## Code Quality Standards

- Make minimal, surgical changes
- Split files by concern when cohesion suffers; line count alone is not a reason.
- Extract an abstraction only when repeated code shares a stable invariant and extraction simplifies its callers.
- Preserve type safety. Use `unknown`, parsing, and type guards instead of `any`, non-null assertions, or type assertions. If third-party interop makes an assertion unavoidable, validate first, keep it local, and explain why.
- Model illegal states out with discriminated unions or equivalent domain types. Parse inputs at boundaries.
- Keep abstractions constrained and document non-obvious contracts.

## Testing

- Write tests that verify semantically correct behavior
- For bug fixes, first add a regression test. Run it and confirm it fails for the expected reason. Implement the fix, then confirm the test passes.
- If no practical test harness or deterministic reproduction exists, state why before editing and use the strongest available validation.
- Do not finish with new failing tests unless the user explicitly requests that result.

## Subagent Coordination

- Assign lint, test, typecheck, and build commands to one agent at a time. When multiple subagents work in parallel, tell them not to run broad verification; the parent runs it once after their changes land unless it explicitly delegates verification to one subagent.

## Plans

- List unresolved questions at the end of each plan. Keep them minimal.
