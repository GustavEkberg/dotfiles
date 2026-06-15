---
name: preview-markdown
description: Create or copy a temporary Markdown file to /tmp and open it in Google Chrome. Use when the user asks to preview, view, open, or render Markdown in Chrome, especially temporary .md drafts with local file links or references.
---

# Preview Markdown

Use this skill when the user wants Markdown content opened in Chrome from a temporary file.

## Workflow

1. Create or copy the Markdown file under `/tmp` with a descriptive, collision-resistant name ending in `.md`.
2. Rewrite all local file links and references to absolute browser-readable URLs.
3. Open the temporary file in Google Chrome.
4. Tell the user the absolute path to the temporary file.

## Absolute References

Before writing the `/tmp` file, make every local file reference absolute.

- Keep `https://`, `http://`, `mailto:`, and existing `file://` links unchanged.
- Convert Markdown links to local files from `[label](relative/path.ext)` to `[label](file:///absolute/path.ext)`.
- Convert image references from `![alt](relative/path.png)` to `![alt](file:///absolute/path.png)`.
- Convert autolinks or plain file references only when they clearly refer to local files.
- Resolve links relative to the source Markdown file's directory when copying an existing file.
- Resolve links relative to the current workspace directory when creating a new temporary file from generated content.
- Encode spaces and unsafe URL characters in `file://` URLs.
- Do not convert in-page anchors like `#section`.

If a referenced local path does not exist, still make it absolute using the correct base directory and call out that it may be broken.

## Open Command

Use macOS `open` with Chrome:

```sh
open -a "Google Chrome" "/tmp/example.md"
```

Quote paths. Do not use repo-relative paths when opening the file.

## Safety

- Do not overwrite source Markdown files.
- Do not edit the original file unless the user explicitly asks.
- Avoid placing secrets or private env values into the temporary file.
- If the Markdown contains links to sensitive local files, warn before opening.
