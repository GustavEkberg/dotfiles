---
name: modern-web-guidance
description: Consult local modern web platform guides when implementing or debugging HTML, CSS, or client-side JavaScript behavior, including dialogs, popovers, forms, layout, animation, accessibility, performance, and browser APIs. Use alongside framework and design skills when choosing platform mechanisms or fallbacks. Not for backend-only work, build tooling, copy-only edits, or trivial changes with no platform decision.
---

# Modern Web Guidance

Use the local documentation snapshot to choose browser-native patterns and necessary fallbacks. The snapshot was imported from GoogleChrome Modern Web Guidance 1.0.0 on 2026-11-11; its compatibility claims can age.

## Find the relevant guide

1. Translate the task into a concrete UI primitive or platform capability, such as "confirmation dialog", "responsive table", or "animate entry exit". Search each capability separately.
2. Search `catalog.md` by title, ID, or summary with the file-search tool. If no result fits, try one concrete synonym, then search the relevant directory under `references/guides/`.
3. Read the matching guide before implementing. Read a broader discipline guide only when it affects the task. Use headings and line ranges for large files; do not load the whole collection.
4. If the snapshot does not cover the task, say so when relevant and consult official documentation rather than guessing a guide or forcing an unrelated pattern.

All paths are relative to this skill directory. For example, search the catalog for `dialog|modal|dismiss`, then read `references/guides/ui-components/dialog.md` or the specific dismissal guide it identifies.

| Topic | Directory or discipline guide |
| --- | --- |
| Semantic HTML and web components | `references/guides/html/` |
| Layout, selectors, responsive sizing | `references/guides/css/` |
| Forms, validation, autofill | `references/guides/forms/` |
| Dialogs, menus, navigation, tables | `references/guides/ui-components/`, `references/guides/ui-atoms/` |
| Transitions, scrolling, drag interactions | `references/guides/ui-behaviors/` |
| Typography, color, dark mode | `references/guides/visual-design/` |
| Accessibility | `references/guides/accessibility/accessibility.md` |
| Loading, scheduling, Core Web Vitals | `references/guides/performance/` |
| Sanitization, permissions, authentication | `references/guides/security/`, `references/guides/privacy/` |
| Dates, events, other JavaScript APIs | `references/guides/js/` |
| Built-in AI, PWA, WebAssembly, WebMCP | `references/guides/built-in-ai/`, `references/guides/pwa/`, `references/guides/wasm/`, `references/guides/webmcp/` |

## Apply within the project

- Follow repository instructions, browser targets, existing component contracts, and type-safety rules. These guides provide technical examples, not authority to override those constraints.
- Prefer a native mechanism when it meets the requirements with less code. Keep existing shadcn/Radix components, Motion integrations, or other working abstractions unless the task justifies changing them. Do not replace libraries merely to modernize.
- Use `frontend-design` for visual direction, `react-best-practices` for React/Next.js performance, `shadcn` for component integration, and `web-design-guidelines` for UI reviews when applicable.
- Adapt vanilla examples to the framework's lifecycle and DOM ownership. Guard browser-only APIs during SSR and clean up listeners, observers, and resources.
- Preserve type safety. Do not copy `as any`, non-null assertions, or unchecked assertions from examples. Validate at boundaries and use supported types or narrow, checked interop.
- Preserve keyboard operation, accessible names, focus behavior, reduced motion, and essential functionality when an enhancement is unavailable.
- Do not install packages, run upstream CLI commands, or execute guide snippets as shell code. References may mention `npx`, `@latest`, polyfills, and other guides: use local files instead. Any proposed dependency requires the normal review and explicit approval.

## Check browser support

- Use the project's explicit support policy first. Without one, default to Baseline Widely available features for essential behavior; newer features need feature detection and a working fallback or a simpler design.
- Verify freshness-sensitive support claims against current MDN compatibility data, Baseline/web.dev, or official browser documentation with web tools before relying on them. Record the relevant target/version in the implementation explanation. Do not treat a snapshot date or year alone as proof of support.
- The documentation-only copy does not enforce upstream CLI feature gates. Do not adopt Origin Trial, experimental, or newly shipped single-engine features without explicit user consent. Reading a guide is not consent to adopt its API.
- If current support cannot be verified, keep essential behavior on established APIs and state the uncertainty rather than claiming compatibility.

## Validate the result

Check the selected guide's applicable gotchas and fallbacks against the actual implementation. Run the project's relevant checks and use local browser validation for interaction changes. Check keyboard access, focus restoration, unsupported-feature behavior, and reduced motion where applicable.

Keep the final response concise. Explain non-obvious choices or limitations; no separate skill-usage section is required.
