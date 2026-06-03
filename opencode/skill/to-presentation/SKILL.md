---
name: to-presentation
description: Export markdown or pasted content to a Gustav-style PPTX deck. Use when the user asks to convert, render, or shape content into a presentation, or runs /to-presentation.
---

# to-presentation - content -> PPTX, gustav.im style

## Purpose

Turn markdown files, pasted content, or a mix of both into a `.pptx` deck that matches the user's presentation style: Satoshi by name, GE mark, neutral Gustav palette, sparse editorial layouts, and subtle signal-flow texture.

## Scope

**In scope:**

- A committable `<name>.deck.md` source (see "Deck markdown format" below) -> `<name>.pptx`. The `.md` is the source of truth; the `.pptx` is a disposable, regenerable artefact.
- One or more raw `.md` files or inline text the agent compresses *into* a deck file first.
- Agent-led content fitting into a small fixed slide vocabulary.
- Deterministic rendering via a zero-dependency Node script. No install step.
- Output goes beside the deck source (see "Output location" below) — temp scratch files do not anchor the default.

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
| `divider` | Opens a new category | Announce the theme of the slides that follow; optional eyebrow + one-line caption | A plain numbered nav break (use `section`) |
| `body` | Explains one argument | One heading + one paragraph | Enumerated content |
| `bullets` | Separates items | 2-8 distinct points | Fake paragraph bullets |
| `compare` | Shows tension | before/after, today/tomorrow | Two unrelated columns |
| `stat` | Anchors one number | Big number + caption | Several metrics |
| `quote` | Lets a source speak | Verbatim quote + attribution | Invented quotes |
| `image` | Shows a diagram / screenshot | One image + heading + optional caption | Decorative filler |
| `closing` | Ends quietly | Closing line + next step/contact | CTA lists |

`hero`, `section`, and `divider` are deliberately different: `hero` is an argument beat; `section` is a numbered nav break (giant index + label); `divider` introduces a *named category* for the slides that follow (eyebrow + large category name + optional caption). In a short deck, skip `section` and `divider`. A `divider`'s title may carry an eyebrow before a separator — `## [divider] 02 — Foundations` renders eyebrow `02` over label `Foundations`; a bare `## [divider] Risks` is label-only. The paragraph under it becomes the "what's coming" caption.

## Deck markdown format (the committable source)

The deck is authored as a standalone markdown file, and **this `.md` is the committable source of truth** — the `.pptx` is a disposable artefact regenerated from it. Name it `<name>.deck.md` and keep it in the repo where the deck belongs; rendering writes `<name>.pptx` next to it (the `.deck` segment is stripped from the output name).

A deck file is plain markdown: YAML frontmatter, an `# H1`, then one `##` section per slide, each tagged with its slide type. The renderer reads only this structure — author it by hand, or have the agent compress raw source into it.

### Frontmatter

```yaml
---
title: My deck title      # deck title + cover fallback
author: Gustav Ekberg     # metadata (default: Gustav Ekberg)
---
```

### Slide markers

Tag each `##` section with its type, either form:

- HTML comment on the line above: `<!-- slide: hero -->`
- Inline prefix in the heading: `## [hero] One sharp thesis line`

Unmarked `##` sections are *inferred* — a best-effort fallback only. For a committable deck, mark every slide explicitly; inference is not guaranteed stable across versions.

If no `cover` slide is present, one is prepended from the title; if no `closing`, one is appended (suppress with `--no-closing`).

### Per-type content shape

Each type reads the `##` heading plus the lines beneath it in a fixed way:

| Type | Heading is… | Body beneath |
| --- | --- | --- |
| `cover` | deck title | first paragraph = subtitle / audience line |
| `hero` | the thesis line | optional paragraph = second line |
| `section` | `NN — Label` | number + label split on `—`/`-`/`:`; bare title → auto number |
| `divider` | `NN — Label` or `Label` | split → eyebrow + category name; first paragraph = caption |
| `body` | heading | paragraph(s), joined (≤ 450 chars) |
| `bullets` | heading | `- item` list, 2–8 items (≤ 140 chars each) |
| `compare` | heading | two `### Side label` blocks each with a paragraph (≤ 240/side); fallbacks: `- Today: …` / `- Tomorrow: …` bullets, or two paragraphs |
| `stat` | the number/value (≤ 40) | paragraph = caption (≤ 160) |
| `quote` | (optional) | `> quote line(s)` (≤ 260) then `— Attribution` |
| `image` | heading | `![alt](path)` = the image; first paragraph = caption (≤ 200) |
| `closing` | closing line | first paragraph = subtitle; `hello@gustav.im` is added automatically |

**Images** are referenced with standard markdown — `![alt](path)` — and **embedded** into the `.pptx` (not linked). The path resolves relative to the deck file's directory, so keep assets beside it (e.g. `attachments/org-current.png`). PNG, JPEG, GIF, and WebP are supported; aspect ratio is preserved and the image is fitted into the slide's content band. A `##` section that contains a markdown image is inferred as an `image` slide even without the marker.

### Example (`imvi-rebuild.deck.md`)

```md
---
title: Imvi rebuild
author: Gustav Ekberg
---

# Imvi rebuild

<!-- slide: cover -->
## Imvi rebuild
Board review · June 2026

<!-- slide: hero -->
## The product system is the risk, not the code.
Code problems are symptoms.

<!-- slide: divider -->
## 01 — Findings
What the review surfaced.

<!-- slide: bullets -->
## Where it breaks
- No product owner
- No release discipline
- Security debt

<!-- slide: compare -->
## Now vs next
### Today
Scattered requests, no acceptance criteria.
### Next
Prioritised roadmap with a definition of done.

<!-- slide: stat -->
## 94%
of school training comes from three providers.

<!-- slide: quote -->
##
> A junior developer doing senior-developer work.
— Michael

<!-- slide: closing -->
## Let's rebuild the right thing.
gustav.im
```

## Workflow

1. **Ask what to focus on — first, before reading deep.** If the input is anything more than a single short, already-shaped file (multiple files, long notes, mixed research, more than a couple hundred words, or any source the user has not pre-curated), stop and ask:
   - Who is the audience?
   - What is the single message of the deck?
   - What must be in it; what can be cut?
   The script enforces this: it rejects any unshaped input over ~1,200 words. Do not bypass with `--allow-unshaped-long` to dodge the question.
2. **Skim, then compress.** With the focus locked, read only what supports it. Cut aggressively. One idea per slide.
3. **Pick the smallest arc that lands the message.** Target 6-10 slides. Going over 15 still renders but the script prints a warning — treat it as a nudge to compress, not a wall. Skip slide types you do not need — do not pad to hit a count.
4. **Write the committable deck file `<name>.deck.md`** at a real workspace path (next to where the deck belongs), unless the user already supplied a deck-shaped file. This is the source the user commits. Mark every slide explicitly with `<!-- slide: <kind> -->`. Use `/tmp` only for genuine throwaways the user will not keep.
5. **Render beside the deck file.** With a `<name>.deck.md` source the default output is already the right place (`<name>.pptx` next to it). Pass `--out` only to override; never let the PPTX default into `/tmp`.
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

The PPTX should land beside its deck source, never in `/tmp`. Priority order:

1. **User named a target.** `--out <path>` they passed, or "save it under work/decks/foo" in chat → use it verbatim.
2. **Committable `<name>.deck.md` source** → `<name>.pptx` beside it (the script strips `.deck` automatically). This is the normal case.
3. **Compressed from a single raw workspace file** with no separate deck file → output beside that file, same basename + `.pptx`.
4. **Inline text only / nothing else fits** → cwd + deck-title slug.

The temp scratch file under `/tmp/to-presentation-*.md` is **never** the anchor for the output path; the script ignores temp paths when picking a default.

**Commit the `.deck.md`, not the `.pptx`.** The deck markdown is source — commit it like any other file. The generated `.pptx` is a rebuildable artefact: do not commit it unless the user asks, and consider gitignoring `*.pptx` under `work/<area>/`.

## Rules

- **PPTX only.** Do not render PDF here.
- **Fit before render.** The script can infer, but the agent owns the editorial judgment.
- **Ask on broad input.** A pile of source docs is not a deck brief. Ask for focus / audience / must-include points before compressing, unless the user already gave them.
- **No walls of text.** Slide budgets are strict: hero <= 2 short lines; body <= 450 chars; compare side <= 240 chars; quote <= 260 chars; bullets <= 8 items, each <= 140 chars. If source exceeds this, cut or ask.
- **No two-slide synonyms.** If content could be `hero` or `section`, choose `hero` unless it is literally a chapter divider. If content could be `body` or `bullets`, choose based on whether the audience must see separate items.
- **Keep slide count low.** 6-12 slides is the default range. More than 15 still renders but triggers a warning — have a reason.
- **Use the user's voice.** Direct, concrete, no hedging, no filler, no AI-speak.
- **No invented quotes or stats.** If the source does not contain it, do not make it a `quote` or `stat`.
- **`.deck.md` is source; `.pptx` is artefact.** Commit the deck markdown; ask before committing the generated `.pptx`.

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
