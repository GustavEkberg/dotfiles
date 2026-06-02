#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { parseDeckMarkdown, resolveSources, slugify, SLIDE_TYPES } from "./deck-markdown.mjs";
import { renderPptx } from "./pptx-package.mjs";

const HELP = `to-presentation - content/markdown -> PPTX, gustav.im style

Usage:
  to-presentation <file.md|text> [more.md|text...] [--out <path>] [--title <title>] [--text <text>]

Options:
  --out <path>      Output PPTX path. Defaults beside first input file, or ./presentation.pptx.
  --title <title>   Override deck title.
  --subtitle <text> Override auto cover subtitle.
  --text <text>     Add inline source text.
  --no-closing      Do not auto-add a closing slide.
  --no-open         Skip auto-opening the PPTX after writing (macOS only).
  --types           Print available slide types.
  -h, --help        Show this help.
`;

const parseArgs = (argv) => {
  const args = { inputs: [], texts: [], out: null, title: null, subtitle: null, noClosing: false, allowUnshapedLong: false, open: true };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "-h" || a === "--help") {
      process.stdout.write(HELP);
      process.exit(0);
    }
    if (a === "--types") {
      process.stdout.write(`${SLIDE_TYPES.join("\n")}\n`);
      process.exit(0);
    }
    if (a === "--out") {
      args.out = argv[i + 1];
      i += 1;
      continue;
    }
    if (a === "--title") {
      args.title = argv[i + 1];
      i += 1;
      continue;
    }
    if (a === "--subtitle") {
      args.subtitle = argv[i + 1];
      i += 1;
      continue;
    }
    if (a === "--text") {
      args.texts.push(argv[i + 1] ?? "");
      i += 1;
      continue;
    }
    if (a === "--no-closing") {
      args.noClosing = true;
      continue;
    }
    if (a === "--allow-unshaped-long") {
      args.allowUnshapedLong = true;
      continue;
    }
    if (a === "--no-open") {
      args.open = false;
      continue;
    }
    args.inputs.push(a);
  }
  return args;
};

const hasExplicitSlideShape = (source) =>
  /<!--\s*slide:\s*[a-zA-Z-]+\s*-->/.test(source) || /^##\s+\[[^\]]+\]/m.test(source);

const wordCount = (source) => source.trim().split(/\s+/).filter(Boolean).length;

const tooLong = (value, max) => String(value ?? "").trim().length > max;

const validateDeck = (deck) => {
  const errors = [];
  if (deck.slides.length > 15) {
    errors.push(`deck has ${deck.slides.length} slides; cap is 15 unless you cut/source-focus first`);
  }
  deck.slides.forEach((slide, idx) => {
    const label = `slide ${idx + 1} (${slide.kind})`;
    if (slide.kind === "hero") {
      if (tooLong(slide.intro, 110)) errors.push(`${label}: intro > 110 chars`);
      if (tooLong(slide.conclusion, 110)) errors.push(`${label}: conclusion > 110 chars`);
    }
    if (slide.kind === "body" && tooLong(slide.body, 450)) errors.push(`${label}: body > 450 chars`);
    if (slide.kind === "bullets") {
      if (!Array.isArray(slide.bullets) || slide.bullets.length < 2) errors.push(`${label}: needs 2+ bullets`);
      if (Array.isArray(slide.bullets) && slide.bullets.length > 8) errors.push(`${label}: > 8 bullets`);
      if (Array.isArray(slide.bullets)) {
        slide.bullets.forEach((item, itemIdx) => {
          if (tooLong(item, 140)) errors.push(`${label}: bullet ${itemIdx + 1} > 140 chars`);
        });
      }
    }
    if (slide.kind === "compare") {
      if (tooLong(slide.leftBody, 240)) errors.push(`${label}: left side > 240 chars`);
      if (tooLong(slide.rightBody, 240)) errors.push(`${label}: right side > 240 chars`);
    }
    if (slide.kind === "quote" && tooLong(slide.quote, 260)) errors.push(`${label}: quote > 260 chars`);
    if (slide.kind === "stat") {
      if (tooLong(slide.value, 40)) errors.push(`${label}: stat value > 40 chars`);
      if (tooLong(slide.caption, 160)) errors.push(`${label}: caption > 160 chars`);
    }
  });
  return errors;
};

const isTempPath = (p) => {
  const resolved = path.resolve(p);
  const tmp = path.resolve(os.tmpdir());
  // macOS resolves /tmp -> /private/tmp and uses /var/folders for $TMPDIR.
  // Treat any of these prefixes as temp so deck markdown stashed in /tmp
  // doesn't drag the PPTX into a hidden directory.
  return (
    resolved.startsWith(`${tmp}${path.sep}`) ||
    resolved.startsWith("/tmp/") ||
    resolved.startsWith("/private/tmp/") ||
    resolved.startsWith("/var/folders/")
  );
};

const defaultOut = (files, title) => {
  // Prefer the first non-temp input file — that's the user-meaningful source.
  // Falling back to the deck title slug in cwd is better than burying the
  // PPTX in /tmp when the agent compressed source into a temp scratch file.
  const nonTemp = files.find((f) => !isTempPath(f));
  if (nonTemp) {
    const parsed = path.parse(nonTemp);
    return path.join(path.dirname(nonTemp), `${parsed.name}.pptx`);
  }
  return path.resolve(`${slugify(title)}.pptx`);
};

const main = () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.inputs.length === 0 && args.texts.length === 0) {
    process.stderr.write(HELP);
    process.exit(1);
  }

  const { files, source } = resolveSources(args.inputs, args.texts);
  if (source.trim().length === 0) {
    process.stderr.write("to-presentation: no content\n");
    process.exit(1);
  }

  const words = wordCount(source);
  if (!args.allowUnshapedLong && !hasExplicitSlideShape(source) && words > 1200) {
    process.stderr.write(
      `to-presentation: ${words} words of unshaped input. Ask what to focus on, then create marked deck markdown first.\n`,
    );
    process.exit(1);
  }

  const deck = parseDeckMarkdown(source, {
    title: args.title,
    subtitle: args.subtitle,
    noClosing: args.noClosing,
  });
  const errors = validateDeck(deck);
  if (errors.length > 0) {
    process.stderr.write(`to-presentation: deck too dense\n- ${errors.join("\n- ")}\n`);
    process.exit(1);
  }
  const outPath = path.resolve(args.out ?? defaultOut(files, deck.title));
  if (!outPath.toLowerCase().endsWith(".pptx")) {
    process.stderr.write(`to-presentation: output must end with .pptx - ${outPath}\n`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, renderPptx(deck));
  process.stdout.write(`${outPath}\n`);

  if (args.open && process.platform === "darwin") {
    try {
      spawn("open", [outPath], { detached: true, stdio: "ignore" }).unref();
    } catch {
      // Silent — opening is a convenience, not a contract.
    }
  }
};

main();
