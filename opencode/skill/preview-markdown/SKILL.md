---
name: preview-markdown
description: Create or copy temporary Markdown to /tmp and open a link-renderable Chrome preview. Use when the user asks to preview, view, open, or render Markdown in Chrome, especially temporary .md drafts with local file:// links or references.
---

# Preview Markdown

Use this skill when the user wants Markdown content opened in Chrome from a temporary file, with links visibly rendered and clickable.

## Workflow

1. Create or copy the Markdown file under `/tmp` with a descriptive, collision-resistant name ending in `.md`.
2. Rewrite all local file links and references to absolute browser-readable URLs.
3. Ensure the Chrome preview renders links as links, not raw Markdown text.
4. Open the rendered preview in Google Chrome.
5. Tell the user the absolute path to the temporary `.md` file and, if created, the `.html` preview file.

## Link Rendering

Chrome does not reliably render raw `.md` files as clickable Markdown without an extension. If clickable links matter, prefer this output shape:

- Write the canonical Markdown file to `/tmp/example.md`.
- Create `/tmp/example.html` as the Chrome preview.
- Render Markdown links as HTML anchors in the preview with exact `href` values.
- Open the `.html` file in Chrome.

The Markdown source should still contain valid Markdown links. The HTML preview is only for display.

Do not rely on bare `file:///...` text becoming clickable. If a path or URL should be clickable, make it an explicit Markdown link in the `.md` file and an explicit `<a href="...">...</a>` in the `.html` file.

## Absolute References

Before writing the `/tmp` file, make every local file reference absolute.

- Keep `https://`, `http://`, `mailto:`, and existing `file://` links unchanged.
- Convert Markdown links to local files from `[label](relative/path.ext)` to `[label](file:///absolute/path.ext)`.
- Convert image references from `![alt](relative/path.png)` to `![alt](file:///absolute/path.png)`.
- Preserve explicit local file URLs like `[triage](file:///Users/abraxas/code/nigel/dp/reference/ISSUE_TRIAGE_140-166.md)` exactly, except for URL-encoding unsafe characters if needed.
- Convert absolute POSIX paths like `/Users/abraxas/code/nigel/dp/reference/ISSUE_TRIAGE_140-166.md` to `[ISSUE_TRIAGE_140-166.md](file:///Users/abraxas/code/nigel/dp/reference/ISSUE_TRIAGE_140-166.md)`.
- Convert bare local file URLs like `file:///Users/abraxas/code/nigel/dp/reference/ISSUE_TRIAGE_140-166.md` to `[ISSUE_TRIAGE_140-166.md](file:///Users/abraxas/code/nigel/dp/reference/ISSUE_TRIAGE_140-166.md)` unless they are already inside a Markdown link.
- Convert autolinks or plain file references only when they clearly refer to local files.
- Resolve links relative to the source Markdown file's directory when copying an existing file.
- Resolve links relative to the current workspace directory when creating a new temporary file from generated content.
- Encode spaces and unsafe URL characters in `file://` URLs, but do not encode `/`, `:`, or the `file://` scheme.
- Do not convert in-page anchors like `#section`.

If a referenced local path does not exist, still make it absolute using the correct base directory and call out that it may be broken.

## Required Link Example

For this input:

```md
See /Users/abraxas/code/nigel/dp/reference/ISSUE_TRIAGE_140-166.md
```

Write this Markdown:

```md
See [ISSUE_TRIAGE_140-166.md](file:///Users/abraxas/code/nigel/dp/reference/ISSUE_TRIAGE_140-166.md)
```

Render this HTML:

```html
See <a href="file:///Users/abraxas/code/nigel/dp/reference/ISSUE_TRIAGE_140-166.md">ISSUE_TRIAGE_140-166.md</a>
```

## Open Command

Use macOS `open` with Chrome. Prefer opening the rendered `.html` preview when one exists:

```sh
open -a "Google Chrome" "/tmp/example.html"
```

If opening raw Markdown is explicitly requested and link rendering is known to work, open the `.md` file:

```sh
open -a "Google Chrome" "/tmp/example.md"
```

Quote paths. Do not use repo-relative paths when opening files.

## Verification

Before opening Chrome, inspect the generated preview and verify expected local links appear as `href="file:///..."`. If the source includes `/Users/abraxas/code/nigel/dp/reference/ISSUE_TRIAGE_140-166.md`, the preview must include:

```html
href="file:///Users/abraxas/code/nigel/dp/reference/ISSUE_TRIAGE_140-166.md"
```

## Safety

- Do not overwrite source Markdown files.
- Do not edit the original file unless the user explicitly asks.
- Avoid placing secrets or private env values into the temporary file.
- If the Markdown contains links to sensitive local files, warn before opening.
