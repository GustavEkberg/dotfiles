# Local Raycast search

This extension reads the committed `HEAD` of a local Git workspace. It searches people, companies, projects, deals, notes, project documents, playbook entries, and invoices by name, ID, context, and tags. Prefixes such as `people` and `notes` narrow results; `a ` shows archived results. The selected result shows its committed Markdown inline. Hide or show the preview with Cmd-Shift-P to give result titles more space.

Set these required values in the extension's Raycast preferences:

- **Workspace Directory:** the local Git workspace containing the domain files.
- **Site Origin:** the hosted app's scheme and host only, with no path.
- **Chrome Profile Directory:** Chrome's internal profile folder name, not its visible label. Find it in Chrome's profile details.

Press Enter to open the selected result in the configured Chrome profile. The browser's own session handles authentication. The extension does not make web requests or store credentials. Its in-memory index refreshes when the local commit changes; **Refresh Workspace** forces a rebuild. Uncommitted files are excluded, and local commits not yet on the hosted site may lead to stale or missing pages.

## Install locally

Run `pnpm install --frozen-lockfile --ignore-scripts`, `pnpm run build`, then `pnpm run dev` once from this directory. Open **Search takt** while development is running; after stopping it with Ctrl-C, Raycast keeps the local extension available. Run `pnpm run dev` again after editing source.

Checks: `pnpm run typecheck`, `pnpm run lint`, `pnpm run format:check`, `pnpm run build`.
