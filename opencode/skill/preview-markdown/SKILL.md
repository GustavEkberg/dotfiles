---
name: preview-markdown
description: Create or copy temporary Markdown to /tmp and open it in Chrome. Use when the user asks to preview, view, open, or render Markdown in Chrome, especially temporary .md drafts with local file:// links or references.
---

# Preview Markdown

Use this skill when the user wants Markdown content opened in Chrome from a temporary `.md` file. The user's Chrome extension renders Markdown and handles links.

## Workflow

1. Create or copy the Markdown file under `/tmp` with a descriptive, collision-resistant name ending in `.md`.
2. Rewrite all local file links and references to absolute browser-readable URLs.
3. Ensure local paths are explicit Markdown links so the Chrome extension can make them clickable.
4. Open the `.md` file in Google Chrome.
5. Tell the user the absolute path to the temporary `.md` file.

## Link Rendering

The preview is Markdown-only. Do not create an HTML preview.

- Write the Markdown file to `/tmp/example.md`.
- Keep links as valid Markdown links with exact `file:///...` href values.
- Open the `.md` file in Chrome.

Do not rely on bare `file:///...` text becoming clickable. If a path or URL should be clickable, make it an explicit Markdown link in the `.md` file.

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

## Open Command

Use macOS `open` with Chrome:

```sh
open -a "Google Chrome" "/tmp/example.md"
```

Quote paths. Do not use repo-relative paths when opening files.

## Verification

Before opening Chrome, inspect the generated Markdown and verify expected local links appear as Markdown links with `file:///...` URLs. If the source includes `/Users/abraxas/code/nigel/dp/reference/ISSUE_TRIAGE_140-166.md`, the Markdown must include:

```md
[ISSUE_TRIAGE_140-166.md](file:///Users/abraxas/code/nigel/dp/reference/ISSUE_TRIAGE_140-166.md)
```

## Safety

- Do not overwrite source Markdown files.
- Do not edit the original file unless the user explicitly asks.
- Avoid placing secrets or private env values into the temporary file.
- If the Markdown contains links to sensitive local files, warn before opening.
