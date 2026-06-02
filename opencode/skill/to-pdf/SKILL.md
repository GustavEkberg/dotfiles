---
name: to-pdf
description: Export a markdown file to a PDF stylized like gustav.im — Satoshi font, opinion-prose layout, signal-flow background. Use when the user asks to convert / export / render a .md file to PDF, or runs /to-pdf.
---

# to-pdf — markdown → PDF, gustav.im style

## Purpose

One command, one file in, one PDF out. Pixel-honest reproduction of the gustav.im opinion-page styling — Satoshi font (embedded), neutral grey palette, generous prose spacing, signal-flow texture tiled in the background — written for paper, not screen (light mode always).

## Scope

**In scope:**

- Single `.md` file → sibling `.pdf`.
- Frontmatter parsing (`title`, `created` / `date`, `author`) rendered as a header block.
- Plain-markdown subset: ATX headings, paragraphs, lists (ul/ol), GFM tables, code fences + inline code, blockquotes, HR, bold / italic / strike / links.
- Mermaid diagrams: ` ```mermaid ` fences render to SVG inside the headless-Chrome pass. The diagram source never leaves the machine; only the mermaid library is fetched from a CDN (jsdelivr), so a `mermaid` export needs network at render time.
- Satoshi `woff2` resolved from `~/code/gustav.im/public/fonts/`, embedded as data-URI; falls back to system sans if missing.
- Signal-flow background generated as a static SVG and tiled per page (subtle — `~5–10%` opacity).

**Out of scope:**

- Multiple files / globs / directories. (Run once per file.)
- Custom themes beyond the gustav.im light/dark palettes, alternate page sizes — A4 fixed.
- Inline HTML, footnotes, raster images, MathJax, citations. Add later if needed.
- Replacing `/research` or any library workflow — this is presentational only, not capture.

## Workflow

1. **Resolve input.** `$ARGUMENTS` is a path to a `.md` file. Error if missing or not `.md`.
2. **Run the script.** From the workspace root:

   ```sh
   node .opencode/skill/to-pdf/scripts/to-pdf.mjs <file.md> [--dark] [--out <path>] [--keep-html]
   ```

   - Default output: sibling `.pdf` (same dir, same basename).
   - `--dark` switches to the gustav.im dark palette; default output becomes `<basename>-dark.pdf`. Run twice (without and with `--dark`) to produce both.
   - `--out` overrides the destination (use when you need a non-default path; pairs with `--dark` cleanly).
   - `--keep-html` retains the intermediate HTML in `/tmp` and prints its path on stdout.

3. **Tell the user the output path.** One line. No recap.

4. **Don't commit the PDF automatically.** PDFs are generated artefacts — let the user decide whether it belongs in the repo. If they do want it committed, follow normal capture rules (`add pdf <basename>` as the commit subject, no prefix).

## Rules

- **Light is the default.** Dark mode is opt-in via `--dark` — meant for on-screen reading, not paper. Don't auto-emit dark unless the user asked.
- **Don't shell out to `pnpm install` or `npx` for deps.** The script is zero-dep on purpose. If the markdown subset is too narrow for a real document, expand the inline parser — don't pull in `marked`.
- **Resolve Chrome lazily.** macOS path first (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`), then Chromium / Linux fallbacks, then PATH. If none, surface the failure — don't silent-fail.
- **The font path is config, not gospel.** Honour `GUSTAV_IM_ROOT` env var if set; otherwise probe `~/code/gustav.im`, then `~/code/takt/gustav.im`. Missing font → fall back, don't crash.
- **Tile the background, don't stretch.** It's a `repeat-y` `background-image` on `body` with `print-color-adjust: exact`. Tiling lets the texture repeat across multi-page documents instead of one stretched copy that disappears after page 1.
- **Never push.** PDFs are local artefacts; the user commits + safe-push handles the rest if they want it tracked.

## Contracts & signature lines

When the document is a contract or any printable form that needs signature, date, or fill-in lines:

- **Use 4+ consecutive underscores** (`____________`) in the markdown source. They render as one continuous full-width rule via `.ml-rule` — works inline mid-sentence ("Signed by ____________ on ____________") or as a standalone line above a label.
- **Never use `***`, `---`, or rows of asterisks.** `***` / `---` render as `<hr>` (a thin horizontal divider across the whole page, not a signature field); asterisks render as bold/italic. Neither produces a usable signing line.
- The rule fills its container, so width is controlled by what wraps it — a short paragraph, a table cell, or a sentence fragment. Put the label on the line below, not above the rule glyphs.

  Example markdown:

  ```md
  ____________________________
  Name (print)

  ____________________________
  Signature

  ____________________________
  Date
  ```

- **Edit the `.md` first, not the script.** If the user's draft uses `***`, dashes, prose ("sign here"), or any other ad-hoc placeholder, rewrite the markdown to use `____` rules before exporting. The markdown is the source of truth — patching presentation in the renderer is out of scope.

## Files

```
.opencode/skill/to-pdf/
  SKILL.md
  scripts/
    to-pdf.mjs   — zero-dep node script (markdown parse + HTML template + Chrome invocation)
```
