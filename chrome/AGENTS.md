# AGENTS.md - Chrome Extensions

Buildless local Chrome MV3 extensions. Keep them self-contained and manually loaded.

## Structure

```
chrome/
|-- color-picker/       # Popup extension using EyeDropper API
`-- markdown-viewer/    # file:// markdown renderer with Mermaid support
```

## Where To Look

| Task | Location | Notes |
|------|----------|-------|
| Color picker popup | `color-picker/popup.html`, `popup.css`, `popup.js` | No permissions |
| Color picker manifest | `color-picker/manifest.json` | MV3 popup entry |
| Markdown renderer | `markdown-viewer/content.js` | Content script; exits unless file is markdown |
| Markdown styles | `markdown-viewer/style.css` | Scope CSS to extension-owned classes |
| Mermaid vendor | `markdown-viewer/vendor/mermaid.min.js` | Vendored, minified, do not hand-edit |
| Manual install docs | `*/README.md` | Keep user-facing setup current |

## Conventions

- No build step unless explicitly requested.
- No package manager unless explicitly requested; use `pnpm` if needed.
- Vanilla JS, 2-space indentation, single quotes, no semicolons.
- Prefer no permissions. Add only the minimum required by Chrome.
- Keep browser API use defensive and graceful.
- Do not add runtime remote scripts.
- Markdown viewer must keep the README note: enable `Allow access to file URLs`.

## Vendor Rules

- Do not hand-edit `vendor/mermaid.min.js`.
- Replace vendor bundles only from known upstream releases.
- Record version, source URL, and hash when replacing vendor files.
- Treat vendored code as loaded attack surface; keep manifest match patterns narrow.

## Anti-Patterns

- Do not introduce bundlers/frameworks for these tiny extensions by default.
- Do not add broad Chrome permissions for convenience.
- Do not let extension CSS leak into host pages.
- Do not load remote JS or CSS.
- Do not assume `content.js` is the first script; vendor scripts in `manifest.json` run before it.

## Validation

```sh
python3 -m json.tool chrome/color-picker/manifest.json >/dev/null
python3 -m json.tool chrome/markdown-viewer/manifest.json >/dev/null
node --check chrome/color-picker/popup.js
node --check chrome/markdown-viewer/content.js
```

Manual smoke required after edits:

- Reload changed extension in `chrome://extensions`.
- Color picker: pick visible pixel, verify RGB/hex and clipboard copy.
- Markdown viewer: open local `.md`, test rendered/raw toggle, tables, code fences, Mermaid.
