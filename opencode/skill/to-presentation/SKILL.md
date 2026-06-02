---
name: to-presentation
description: Export markdown or pasted content to a Gustav-style PPTX deck. Use when the user asks to convert, render, or shape content into a presentation, or runs /to-presentation.
---

# to-presentation - content -> PPTX, gustav.im style

## Purpose

Turn markdown files, pasted content, or a mix of both into a `.pptx` deck that matches the user's presentation style: Satoshi by name, GE mark, neutral Gustav palette, sparse editorial layouts, and subtle signal-flow texture.

## Scope

**In scope:**

- One or more `.md` files, inline text, or a temporary deck markdown file -> `.pptx`.
- Agent-led content fitting into a small fixed slide vocabulary.
- Deterministic rendering via a zero-dependency Node script. No install step.
- Output goes beside the user-meaningful source (see "Output location" below) — temp scratch files do not anchor the default.

**Out of scope:**

- PDF export. `/to-pdf` already owns that.
- Full PowerPoint editing, animations, speaker notes, charts, embedded media, or custom themes.
- Blind dumping of long prose into slides. The agent must compress and fit content first.
- Auto-committing generated `.pptx` files. Ask before committing generated artefacts.

## Slide types

Use the smallest set that covers different jobs. If two seem interchangeable, drop one from the deck rather than forcing both.

| Type | Job | Use | Avoid |
| --- | --- | --- | --- |
| `cover` | Opens the deck | Title + subtitle | Mid-deck breaks |
| `hero` | Lands one thesis | One strong sentence, optional second line | Lists or paragraphs |
| `section` | Chapter break | Long decks only, 8+ slides | Short decks |
| `body` | Explains one argument | One heading + one paragraph | Enumerated content |
| `bullets` | Separates items | 2-8 distinct points | Fake paragraph bullets |
| `compare` | Shows tension | before/after, today/tomorrow | Two unrelated columns |
| `stat` | Anchors one number | Big number + caption | Several metrics |
| `quote` | Lets a source speak | Verbatim quote + attribution | Invented quotes |
| `closing` | Ends quietly | Closing line + next step/contact | CTA lists |

`hero` and `section` are deliberately different: `hero` is an argument beat; `section` is navigation. In a short deck, skip `section`.

## Deck markdown contract

The renderer reads a compact slide-markdown format. The agent should create this in `/tmp` when the source content is not already shaped.

```md
---
title: My deck title
author: Gustav Ekberg
---

# My deck title

<!-- slide: cover -->
## Deck title
Subtitle or audience line.

<!-- slide: hero -->
## One sharp thesis line
Optional second line.

<!-- slide: bullets -->
## What matters
- First point
- Second point

<!-- slide: closing -->
## Let's talk.
hello@gustav.im
```

Accepted markers:

- HTML comment before a slide: `<!-- slide: hero -->`
- Heading marker: `## [hero] One sharp thesis line`

Unmarked `##` sections are inferred, but inference is a fallback. For real work, mark slide types explicitly.

## Workflow

1. **Ask what to focus on — first, before reading deep.** If the input is anything more than a single short, already-shaped file (multiple files, long notes, mixed research, more than a couple hundred words, or any source the user has not pre-curated), stop and ask:
   - Who is the audience?
   - What is the single message of the deck?
   - What must be in it; what can be cut?
   The script enforces this: it rejects any unshaped input over ~1,200 words. Do not bypass with `--allow-unshaped-long` to dodge the question.
2. **Skim, then compress.** With the focus locked, read only what supports it. Cut aggressively. One idea per slide.
3. **Pick the smallest arc that lands the message.** Target 6-10 slides; hard cap 15 unless the user asks for more. Skip slide types you do not need — do not pad to hit a count.
4. **Write deck markdown in `/tmp/to-presentation-<slug>.md`** unless the user already supplied a deck-shaped file. Mark every slide explicitly with `<!-- slide: <kind> -->`.
5. **Pick the output location** (see "Output location" below) and pass it via `--out` whenever the source content was compressed from a real workspace file. Never let the PPTX default into `/tmp` — the script falls back to cwd in that case, which is still rarely what the user wants.
6. **Run the script from workspace root:**

   ```sh
   node .opencode/skill/to-presentation/scripts/to-presentation.mjs <file.md> [more.md] [--out <path>]
   ```

   Useful flags:

   - `--text <text>` adds inline source text without writing a file.
   - `--title <title>` overrides the deck title.
   - `--out <path>` writes a specific `.pptx` path.
   - `--no-open` skips the auto-open on macOS.
   - `--types` prints the slide type list and exits.

7. **The script auto-opens the PPTX on macOS** after writing. The agent does not need to run `open` separately. Pass `--no-open` if the user wants the file written silently.
8. **QA visually.** For any user-facing deck, load the `pptx` skill and run its inspect / fix / re-check loop on the generated file. Wrapping and overflow happen.
9. **Return the output path.** One line. Do not commit unless the user asks.

## Output location

The PPTX should land somewhere the user can find without searching `/tmp`. Decide based on what the deck was made from, in priority order:

1. **User named a target.** `--out <path>` they passed, or "save it under work/decks/foo" in chat → use it verbatim.
2. **Compressed from a single workspace file** (e.g. `me/playbook/<slug>.md`, `work/blog/posts/<slug>.md`, `notes/<date>-<slug>.md`) → output beside that file, same basename + `.pptx`. Example: source `me/playbook/digital-product-development-manifesto.md` → `me/playbook/digital-product-development-manifesto.pptx`.
3. **Compressed from multiple workspace files** under a common parent → that parent dir + deck-title slug. Example: sources under `work/blog/posts/` → `work/blog/posts/<deck-slug>.pptx`.
4. **Inline text only / nothing else fits** → cwd + deck-title slug.

The temp scratch file under `/tmp/to-presentation-*.md` is **never** the anchor for the output path. The script ignores temp paths when picking a default, but the agent should still pass `--out` explicitly whenever a real source file exists — it's clearer in the command and immune to script changes.

Generated decks are artefacts. Do not commit them unless the user asks. `work/<area>/` directories may want them gitignored locally; check before staging.

## Rules

- **PPTX only.** Do not render PDF here.
- **Fit before render.** The script can infer, but the agent owns the editorial judgment.
- **Ask on broad input.** A pile of source docs is not a deck brief. Ask for focus / audience / must-include points before compressing, unless the user already gave them.
- **No walls of text.** Slide budgets are strict: hero <= 2 short lines; body <= 450 chars; compare side <= 240 chars; quote <= 260 chars; bullets <= 8 items, each <= 140 chars. If source exceeds this, cut or ask.
- **No two-slide synonyms.** If content could be `hero` or `section`, choose `hero` unless it is literally a chapter divider. If content could be `body` or `bullets`, choose based on whether the audience must see separate items.
- **Keep slide count low.** 6-12 slides is the default range. More than 15 needs a reason.
- **Use the user's voice.** Direct, concrete, no hedging, no filler, no AI-speak.
- **No invented quotes or stats.** If the source does not contain it, do not make it a `quote` or `stat`.
- **Generated PPTX is an artefact.** Ask before committing it.

## Font

The deck references `Satoshi` by name. The script does not embed it — install it locally (Fontshare ships static + variable TTFs). If Satoshi is missing, Keynote and PowerPoint silently substitute a system sans and the deck loses its character. If a render looks wrong, suspect the font first.

## Files

```txt
.opencode/skill/to-presentation/
  SKILL.md
  scripts/
    to-presentation.mjs  # CLI + auto-open
    deck-markdown.mjs    # source/deck parser
    pptx-renderer.mjs    # slide renderers + chrome (signal flow + GE mark)
    pptx-package.mjs     # OOXML envelope (theme/master/layout + zip assembly)
    zip-store.mjs        # minimal no-compression ZIP writer
```
