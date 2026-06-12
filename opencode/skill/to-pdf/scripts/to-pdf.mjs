#!/usr/bin/env node
// to-pdf — markdown → PDF, styled like gustav.im. Zero external deps.
//
// Usage:
//   node to-pdf.mjs <file.md> [--out <path>] [--keep-html]

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { spawn, spawnSync } from "node:child_process";

const HELP = `to-pdf — markdown → PDF, gustav.im style

Usage:
  to-pdf <file.md> [--dark] [--out <path>] [--keep-html] [--no-page-numbers]

Options:
  --dark              Render in dark mode (gustav.im dark palette).
                      Default output then becomes <basename>-dark.pdf.
  --out <path>        Output PDF path (overrides default sibling location)
  --keep-html         Keep intermediate HTML in /tmp and print its path
  --no-page-numbers   Omit the per-page "n / total" footer numbering
  -h, --help          Show this help

Env:
  GUSTAV_IM_ROOT  Override path to gustav.im checkout (default: ~/code/gustav.im)
`;

// ─── args ──────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { _: [], out: null, keepHtml: false, dark: false, pageNumbers: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") {
      process.stdout.write(HELP);
      process.exit(0);
    } else if (a === "--out") {
      args.out = argv[++i];
    } else if (a === "--keep-html") {
      args.keepHtml = true;
    } else if (a === "--dark") {
      args.dark = true;
    } else if (a === "--no-page-numbers") {
      args.pageNumbers = false;
    } else {
      args._.push(a);
    }
  }
  return args;
}

// ─── frontmatter ───────────────────────────────────────────────────────────

function parseFrontmatter(src) {
  if (!src.startsWith("---\n") && !src.startsWith("---\r\n")) {
    return { data: {}, content: src };
  }
  const nl = src.startsWith("---\r\n") ? "\r\n" : "\n";
  const open = 3 + nl.length;
  const close = src.indexOf(`${nl}---${nl}`, open);
  if (close === -1) return { data: {}, content: src };
  const yaml = src.slice(open, close);
  const content = src.slice(close + 3 + nl.length * 2);
  const data = {};
  for (const line of yaml.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    data[m[1]] = val;
  }
  return { data, content };
}

// ─── markdown → html (minimal subset) ─────────────────────────────────────

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMd(raw) {
  // 0) A run of 4+ underscores (escaped or plain) is a signature / fill-in
  //    rule. Stash it so it survives the rest of the pipeline, then emit
  //    a styled span at the end — looks like one continuous line instead
  //    of disconnected underscore glyphs.
  let s = raw.replace(/(?:\\_|_){4,}/g, "\x03RULE\x03");
  // 1) Pull backslash escapes out next so the literal char survives every
  //    later regex unscathed. CommonMark escapes any ASCII punctuation.
  const escStash = [];
  s = s.replace(/\\([\\`*_{}\[\]()#+\-.!~|<>:])/g, (_, c) => {
    escStash.push(c);
    return `\x02ESC${escStash.length - 1}\x02`;
  });
  // 2) HTML-escape the rest.
  s = escapeHtml(s);
  // 3) Inline code — protect contents from further substitution.
  const codeStash = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => {
    codeStash.push(c);
    return `\x00CODE${codeStash.length - 1}\x00`;
  });
  // 4) Links: [text](url)
  s = s.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_, t, u) => `<a href="${u}">${t}</a>`,
  );
  // 5) Bold then italic — longest tokens first to avoid overlap.
  s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g, "$1<em>$2</em>");
  s = s.replace(/(^|[^_\w])_([^_\n]+)_(?!\w)/g, "$1<em>$2</em>");
  // 6) Strikethrough
  s = s.replace(/~~([^~\n]+)~~/g, "<s>$1</s>");
  // 7) Restore stashes.
  s = s.replace(/\x00CODE(\d+)\x00/g, (_, i) => `<code>${codeStash[+i]}</code>`);
  s = s.replace(/\x02ESC(\d+)\x02/g, (_, i) => escapeHtml(escStash[+i]));
  s = s.replace(/\x03RULE\x03/g, '<span class="ml-rule"></span>');
  return s;
}

function mdToHtml(src) {
  const lines = src.split(/\r?\n/);
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    if (/^(---+|\*\*\*+|___+)\s*$/.test(line)) {
      out.push("<hr>");
      i++;
      continue;
    }

    if (/^<!--\s*page-break\s*-->\s*$/.test(line.trim())) {
      out.push('<div class="page-break"></div>');
      i++;
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const lvl = h[1].length;
      out.push(`<h${lvl}>${inlineMd(h[2].trim())}</h${lvl}>`);
      i++;
      continue;
    }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      i++;
      const buf = [];
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++; // closing fence
      if (lang === "mermaid") {
        // Rendered client-side by mermaid.js inside the headless Chrome
        // pass (see the injected module below). The diagram source never
        // leaves the machine — only the mermaid library is fetched.
        out.push(`<pre class="mermaid">${escapeHtml(buf.join("\n"))}</pre>`);
        continue;
      }
      const cls = lang ? ` class="language-${lang}"` : "";
      out.push(
        `<pre><code${cls}>${escapeHtml(buf.join("\n"))}</code></pre>`,
      );
      continue;
    }

    if (line.startsWith("> ")) {
      const buf = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        buf.push(lines[i].slice(2));
        i++;
      }
      out.push(`<blockquote>${inlineMd(buf.join(" "))}</blockquote>`);
      continue;
    }

    // GFM table — header row, then a separator row of cells like ---
    // (optionally :--- / ---: / :---: for alignment), then any number
    // of data rows starting with `|`.
    if (
      line.trim().startsWith("|") &&
      i + 1 < lines.length &&
      /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[i + 1])
    ) {
      const parseRow = (l) => {
        let s = l.trim();
        if (s.startsWith("|")) s = s.slice(1);
        if (s.endsWith("|")) s = s.slice(0, -1);
        return s.split("|").map((c) => c.trim());
      };
      const header = parseRow(line);
      const sep = parseRow(lines[i + 1]);
      const aligns = sep.map((s) => {
        if (/^:.*:$/.test(s)) return "center";
        if (/:$/.test(s)) return "right";
        if (/^:/.test(s)) return "left";
        return null;
      });
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      const styleFor = (idx) =>
        aligns[idx] ? ` style="text-align:${aligns[idx]}"` : "";
      const hasHeader = header.some((c) => c !== "");
      const thead = hasHeader
        ? `<thead><tr>${header
            .map((c, j) => `<th${styleFor(j)}>${inlineMd(c)}</th>`)
            .join("")}</tr></thead>`
        : "";
      const tbody = `<tbody>${rows
        .map(
          (r) =>
            `<tr>${r
              .map((c, j) => `<td${styleFor(j)}>${inlineMd(c)}</td>`)
              .join("")}</tr>`,
        )
        .join("")}</tbody>`;
      out.push(`<table>${thead}${tbody}</table>`);
      continue;
    }

    const ulm = line.match(/^[-*+]\s+(.*)$/);
    const olm = line.match(/^(\d+)\.\s+(.*)$/);
    if (ulm || olm) {
      const ordered = !!olm;
      const start = ordered ? +olm[1] : 1;
      const items = [];
      const re = ordered ? /^\d+\.\s+(.*)$/ : /^[-*+]\s+(.*)$/;
      // A line that opens a different block construct ends the current item
      // (and, unless it's another marker of this list, the list itself).
      const isBlockOpener = (l) =>
        /^#{1,6}\s+/.test(l) || l.startsWith("```") || l.startsWith("> ") ||
        /^[-*+]\s+/.test(l) || /^\d+\.\s+/.test(l) ||
        /^(---+|\*\*\*+|___+)\s*$/.test(l) || l.trim().startsWith("|");
      while (i < lines.length) {
        const m = lines[i].match(re);
        if (!m) {
          // Loose list: a blank line between items doesn't end the list when
          // the next non-blank line is another marker of the same kind.
          if (lines[i].trim() === "") {
            let k = i;
            while (k < lines.length && lines[k].trim() === "") k++;
            if (k < lines.length && re.test(lines[k])) { i = k; continue; }
          }
          break;
        }
        // Item text wraps across source lines (indented or lazy continuation)
        // — fold them into the item instead of leaking a separate <p>.
        const buf = [m[1]];
        i++;
        while (
          i < lines.length &&
          lines[i].trim() !== "" &&
          (/^\s/.test(lines[i]) || !isBlockOpener(lines[i]))
        ) {
          buf.push(lines[i].trim());
          i++;
        }
        items.push(`<li>${inlineMd(buf.join(" "))}</li>`);
      }
      const tag = ordered ? "ol" : "ul";
      const startAttr = ordered && start !== 1 ? ` start="${start}"` : "";
      out.push(`<${tag}${startAttr}>${items.join("")}</${tag}>`);
      continue;
    }

    // Paragraph — collect until blank line or new block opener.
    const buf = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("> ") &&
      !/^[-*+]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^(---+|\*\*\*+|___+)\s*$/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    out.push(`<p>${inlineMd(buf.join(" "))}</p>`);
  }
  return out.join("\n");
}

// ─── signal-flow background (static svg) ──────────────────────────────────

function generateBackgroundSvg({ dark = false, width = 800, height = 1200, strength = 1 } = {}) {
  // Lower density than the live site — print doesn't need motion, and a
  // dense SVG slows chrome's headless render enough to stall the exit.
  const density = 5e-5;
  const count = Math.round(width * height * density);
  const connectDist = 140;
  // Pre-flatten alpha into solid hex colours against the page bg. Some
  // PDF renderers (mobile Preview, browser viewers, certain libs) over-
  // emphasise stroke-opacity / fill-opacity in unpredictable ways; an
  // opaque hex prints identically everywhere.
  const bg = dark ? [10, 10, 10] : [255, 255, 255];
  const fg = dark ? [255, 255, 255] : [0, 0, 0];
  // `strength` boosts the texture (the cover uses a stronger value than the
  // body pages). Clamp so a high multiplier can't push alpha past 1.
  // Chrome's PDF viewer aliases 0.5px vector hairlines into dotted seams at
  // some zoom levels. Use a wider, lighter stroke instead: similar perceived
  // weight, more stable rasterization.
  const lineMax = Math.min(1, (dark ? 0.04 : 0.03) * strength);
  const dotAlpha = Math.min(1, (dark ? 0.11 : 0.08) * strength);
  const blend = (alpha) => {
    const mix = (c) =>
      Math.round(bg[c] + (fg[c] - bg[c]) * alpha)
        .toString(16)
        .padStart(2, "0");
    return `#${mix(0)}${mix(1)}${mix(2)}`;
  };
  const dotColour = blend(dotAlpha);
  const nodes = [];
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
    });
  }
  const lines = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dsq = dx * dx + dy * dy;
      if (dsq < connectDist * connectDist) {
        const d = Math.sqrt(dsq);
        const a = (1 - d / connectDist) * lineMax;
        lines.push(
          `<line x1="${nodes[i].x.toFixed(1)}" y1="${nodes[i].y.toFixed(1)}" x2="${nodes[j].x.toFixed(1)}" y2="${nodes[j].y.toFixed(1)}" stroke="${blend(a)}" stroke-width="0.85" stroke-linecap="round"/>`,
        );
      }
    }
  }
  const circles = nodes
    .map(
      (n) =>
        `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="1.2" fill="${dotColour}"/>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" shape-rendering="geometricPrecision">${lines.join("")}${circles}</svg>`;
}

// ─── font resolution ──────────────────────────────────────────────────────

function findFont() {
  const candidates = [
    process.env.GUSTAV_IM_ROOT &&
      path.join(
        process.env.GUSTAV_IM_ROOT,
        "public/fonts/Satoshi-Variable.woff2",
      ),
    path.join(os.homedir(), "code/gustav.im/public/fonts/Satoshi-Variable.woff2"),
    path.join(os.homedir(), "code/takt/gustav.im/public/fonts/Satoshi-Variable.woff2"),
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function fontFaceCss() {
  const fontPath = findFont();
  if (!fontPath) {
    return "/* Satoshi not found — system sans fallback */";
  }
  const b64 = fs.readFileSync(fontPath).toString("base64");
  return `@font-face {
  font-family: 'Satoshi';
  src: url('data:font/woff2;base64,${b64}') format('woff2');
  font-weight: 300 900;
  font-display: block;
}`;
}

// ─── date ─────────────────────────────────────────────────────────────────

function formatDate(s) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── chrome resolution ────────────────────────────────────────────────────

function findChrome() {
  const fixed = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  for (const c of fixed) {
    if (fs.existsSync(c)) return c;
  }
  for (const name of ["google-chrome", "chromium", "chromium-browser", "chrome"]) {
    const r = spawnSync("which", [name], { encoding: "utf8" });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  return null;
}

// ─── html template ────────────────────────────────────────────────────────

// GE mark — shared by the first-page header and the doc footer. Mirrors
// me/attachments/logo/logo.tsx; uses currentColor so it inherits whichever
// text colour the surrounding container sets.
const LOGO_SVG =
  '<svg class="mark" viewBox="0 0 32 32" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M 8 5 H 28 V 27 H 8 A 4 4 0 0 1 4 23 V 9 A 4 4 0 0 1 8 5 Z" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
  '<line x1="16" y1="5" x2="16" y2="27" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
  '<line x1="16" y1="16" x2="11" y2="16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
  '<line x1="16" y1="16" x2="24" y2="16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
  "</svg>";

function buildHtml({ inner, docTitle = "", dark = false, hasMermaid = false, bgStrength = 1 }) {
  const svg = generateBackgroundSvg({ dark, strength: bgStrength });
  const svgB64 = Buffer.from(svg).toString("base64");
  // Palette mirrors gustav.im — light pulls from :root, dark from .dark.
  const palette = dark
    ? `
  --grey-100: #1c1c1c;
  --grey-200: #262626;
  --grey-300: #3a3a3a;
  --grey-500: #737373;
  --grey-600: #a3a3a3;
  --grey-900: #fafafa;
  --background: #0a0a0a;
  --border-strong: rgba(255, 255, 255, 0.18);
  --divider: rgba(255, 255, 255, 0.07);
  --divider-strong: rgba(255, 255, 255, 0.12);
`
    : `
  --grey-100: #f5f5f5;
  --grey-200: #e5e5e5;
  --grey-300: #d4d4d4;
  --grey-500: #737373;
  --grey-600: #525252;
  --grey-900: #171717;
  --background: #ffffff;
  --border-strong: #171717;
  --divider: rgba(0, 0, 0, 0.06);
  --divider-strong: rgba(0, 0, 0, 0.1);
`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(docTitle)}</title>
<style>
${fontFaceCss()}

:root {${palette}}

@page {
  size: A4;
  margin: 0;
}

* {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  box-sizing: border-box;
}

/* Put the texture in a fixed print layer, not on the root page canvas. Chrome
 * may raster-cache the first page of each separately rendered PDF differently;
 * a fixed DOM layer is repeated per printed page, so every content page gets
 * the same texture treatment. Cover strength still comes from bgStrength. */
html {
  height: 100%;
  background-color: var(--background);
  color: var(--grey-900);
  font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  padding: 0;
}

body {
  height: 100%;
  background: transparent;
  margin: 0;
  padding: 0;
}

body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: url("data:image/svg+xml;base64,${svgB64}");
  background-repeat: repeat-y;
  background-size: 100% auto;
  background-position: top center;
  pointer-events: none;
}

/* The wrapper carries per-page padding. box-decoration-break: clone asks
 * chrome to repeat the box's padding at every page-fragment boundary so
 * pages 2..N also get a top/bottom inset (not only the first/last).
 *
 * Bottom padding is smaller than top because Chrome reserves a print
 * margin band at the page floor for the native running footer (brand +
 * page number); padding-bottom + that margin together restore the ~3cm
 * bottom inset. The footer is drawn by Chrome's print engine, not the
 * DOM, so it is positioned perfectly on every page with no arithmetic. */
.page {
  position: relative;
  z-index: 1;
  padding: 3cm 1.8cm 1.4cm;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}

article {
  max-width: 36rem;
  margin: 0 auto;
  width: 100%;
}

/* Cover page — fills one A4 sheet, content block sitting in the lower-left
 * third (a calm, gustav.im-ish title layout). The page background texture
 * still bleeds edge to edge behind it. */
.cover {
  /* Fill exactly one sheet: 100vh minus the .page top+bottom padding
   * (3cm + 1.4cm) that wraps this inner. Without the subtraction the cover
   * overflows onto a second blank page. Content is vertically centred. */
  min-height: calc(100vh - 4.4cm);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* Sit a little above the true vertical centre — the bottom padding
   * shrinks the centring region, lifting the block upward. */
  padding-bottom: 3cm;
}

.cover-top {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1.1rem;
  margin-bottom: 2.5rem;
}

.cover-mark {
  color: var(--grey-900);
  display: inline-flex;
}

.cover-mark .mark {
  width: 24px;
  height: 24px;
}

.cover-title {
  font-size: 2.6rem;
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
  color: var(--grey-900);
  /* Match the 36rem body column — 30rem wrapped long titles to 4+ lines. */
  max-width: 36rem;
}

.cover-subtitle {
  font-size: 1.05rem;
  font-weight: 450;
  line-height: 1.5;
  color: var(--grey-600);
  margin: 1.1rem 0 0;
  max-width: 28rem;
}

.cover-meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  letter-spacing: 0.02em;
  color: var(--grey-500);
}

.cover-date,
.cover-domain {
  color: inherit;
  text-decoration: none;
}

.cover-dot {
  opacity: 0.6;
}

.prose {
  color: var(--grey-600);
  font-weight: 450;
  line-height: 1.7;
  font-size: 0.95rem;
}

.prose h1 {
  color: var(--grey-900);
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.01em;
  margin-top: 0;
  margin-bottom: 1.5rem;
  page-break-after: avoid;
  break-after: avoid;
}

.prose h1:first-child { margin-top: 0; }

.prose h2 {
  color: var(--grey-900);
  font-size: 1.4rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
  margin-top: 2.1rem;
  margin-bottom: 0.85rem;
  page-break-after: avoid;
  break-after: avoid;
}

.prose h3 {
  color: var(--grey-900);
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 1.7rem;
  margin-bottom: 0.6rem;
  page-break-after: avoid;
  break-after: avoid;
}

.prose p {
  margin: 1.05rem 0;
  orphans: 3;
  widows: 3;
}

.prose p:first-child { margin-top: 0; }

.prose strong { color: var(--grey-900); font-weight: 600; }

.prose a {
  color: var(--grey-900);
  font-weight: 500;
  text-decoration: none;
  border-bottom: 1px solid var(--border-strong);
}

.prose ul, .prose ol {
  margin: 1.05rem 0;
  padding-left: 1.4rem;
}
.prose ul { list-style: disc; }
.prose ol { list-style: decimal; }
.prose li { margin: 0.4rem 0; }

.prose blockquote {
  border-left: 2px solid var(--grey-300);
  padding-left: 1rem;
  margin: 1.4rem 0;
  font-style: italic;
  color: var(--grey-500);
}

.prose hr {
  border: none;
  border-top: 1px solid var(--divider);
  margin: 2.1rem 0;
}

.prose .page-break {
  break-before: page;
  page-break-before: always;
}

.prose code {
  font-size: 0.85em;
  background: var(--grey-100);
  padding: 0.12em 0.35em;
  border-radius: 0.25rem;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
}

.prose pre {
  background: var(--grey-100);
  padding: 0.9rem 1.1rem;
  border-radius: 0.5rem;
  overflow: hidden;
  margin: 1.3rem 0;
  font-size: 0.82em;
  page-break-inside: avoid;
  break-inside: avoid;
  white-space: pre-wrap;
  word-break: break-word;
}

.prose pre code {
  background: none;
  padding: 0;
  font-size: 1em;
}

.prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.4rem 0;
  font-size: 0.92em;
  page-break-inside: avoid;
  break-inside: avoid;
}

.prose th,
.prose td {
  padding: 0.55rem 0.8rem;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid var(--divider);
}

.prose th {
  color: var(--grey-900);
  font-weight: 600;
  border-bottom: 1px solid var(--divider-strong);
}

.prose tbody tr:last-child td {
  border-bottom: none;
}

.prose table strong {
  /* Inside contract signature lines (rows of escaped asterisks), the
   * bold tokens stack into a long visual line — keep them from soft-
   * breaking across cells. */
  word-break: keep-all;
}

/* Inline "signature / fill-in" line. Emitted whenever the markdown
 * contains 4+ consecutive underscores (escaped or plain). Renders as
 * one continuous line filling its container instead of a row of
 * disconnected underscore glyphs. */
.prose .ml-rule {
  display: inline-block;
  width: 100%;
  min-width: 6rem;
  border-bottom: 1px solid currentColor;
  height: 1em;
  vertical-align: baseline;
  opacity: 0.7;
}

/* Mermaid diagrams: strip the code-block chrome and center the rendered
 * SVG. Before mermaid.js runs the source sits in a <pre class="mermaid">;
 * after, the same node holds an <svg>. */
.prose pre.mermaid {
  background: none;
  border: none;
  padding: 0;
  margin: 1.6rem 0;
  text-align: center;
  white-space: normal;
  page-break-inside: avoid;
  break-inside: avoid;
}

.prose pre.mermaid svg {
  max-width: 100%;
  height: auto;
}
</style>
</head>
<body>
${
  hasMermaid
    ? `
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
  mermaid.initialize({ startOnLoad: false, theme: "neutral", flowchart: { useMaxWidth: true, htmlLabels: true } });
  try {
    await mermaid.run({ querySelector: "pre.mermaid" });
  } catch (e) {
    console.error("mermaid render failed", e);
  }
</script>`
    : ""
}
<div class="page">
${inner}
</div>
</body>
</html>`;
}

// Content body: the prose column. Branding + page number live in the native
// print footer (every page); the title, when present, lives on the cover.
function contentInner(bodyHtml) {
  return `<article>
  <div class="prose">
${bodyHtml}
  </div>
</article>`;
}

// Cover page: GE mark, title, optional subtitle + date. A full A4 page on its
// own (no footer, not counted) — content numbering starts on the next page.
function coverInner({ title, subtitle, dateStr, dateRaw }) {
  return `<section class="cover">
  <div class="cover-top">
    <span class="cover-mark">${LOGO_SVG}</span>
    <div class="cover-meta">
      ${dateStr ? `<time class="cover-date" datetime="${escapeHtml(dateRaw)}">${escapeHtml(dateStr)}</time><span class="cover-dot">·</span>` : ""}
      <a class="cover-domain" href="https://gustav.im">gustav.im</a>
    </div>
  </div>
  <h1 class="cover-title">${inlineMd(title)}</h1>
  ${subtitle ? `<p class="cover-subtitle">${inlineMd(subtitle)}</p>` : ""}
</section>`;
}

// ─── main ─────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args._.length === 0) {
    process.stderr.write(HELP);
    process.exit(1);
  }
  if (args._.length > 1) {
    process.stderr.write("to-pdf: pass exactly one .md file\n");
    process.exit(1);
  }

  const inputPath = path.resolve(args._[0]);
  if (!fs.existsSync(inputPath)) {
    process.stderr.write(`to-pdf: not found — ${inputPath}\n`);
    process.exit(1);
  }
  if (!/\.md$/i.test(inputPath)) {
    process.stderr.write(`to-pdf: expected a .md file — got ${inputPath}\n`);
    process.exit(1);
  }

  const outPath = args.out
    ? path.resolve(args.out)
    : inputPath.replace(/\.md$/i, args.dark ? "-dark.pdf" : ".pdf");

  const src = fs.readFileSync(inputPath, "utf8");
  const { data, content } = parseFrontmatter(src);

  // Cover fields. Frontmatter wins; otherwise a leading `# H1` (plus the
  // paragraph right after it, if any) is promoted to the cover and stripped
  // from the body so it isn't duplicated. No title anywhere → no cover page.
  const cover = extractCover(content, data);
  const bodyHtml = mdToHtml(cover.body);
  const hasMermaid = /<pre class="mermaid">/.test(bodyHtml);

  const chrome = findChrome();
  if (!chrome) {
    process.stderr.write(
      "to-pdf: chrome / chromium not found. Install Google Chrome or set CHROME_PATH.\n",
    );
    process.exit(1);
  }

  const tmpHtml = (tag) =>
    path.join(
      os.tmpdir(),
      `to-pdf-${Date.now()}-${Math.random().toString(36).slice(2)}-${tag}-${path.basename(inputPath, ".md")}.html`,
    );

  // Content is always its own document so Chrome's native footer numbers it
  // 1..M (physical page index == visible number). The cover, when present,
  // is a separate footer-less render prepended afterwards — which is why the
  // page count starts on the first content page, not the cover.
  const contentHtmlPath = tmpHtml("body");
  fs.writeFileSync(contentHtmlPath, buildHtml({
    inner: contentInner(bodyHtml), docTitle: cover.title,
    dark: args.dark, hasMermaid,
  }), "utf8");

  // Render content with the footer. Native displayHeaderFooter draws the
  // brand + "n / total" on every page, positioned by the print engine — no
  // DOM arithmetic, no per-page drift, correct across forced breaks /
  // unbreakable tables / mermaid diagrams.
  const contentPdf = cover.title ? outPath + ".content.pdf" : outPath;
  await renderPdf(chrome, contentHtmlPath, contentPdf, {
    dark: args.dark, hasMermaid,
    footerTemplate: footerTemplate({ dark: args.dark, showNumber: args.pageNumbers }),
  });
  // A lone "1 / 1" is noise — re-render numberless once we know it's 1 page.
  if (args.pageNumbers && countPdfPages(contentPdf) === 1) {
    await renderPdf(chrome, contentHtmlPath, contentPdf, {
      dark: args.dark, hasMermaid,
      footerTemplate: footerTemplate({ dark: args.dark, showNumber: false }),
    });
  }

  let coverHtmlPath = null;
  if (cover.title) {
    coverHtmlPath = tmpHtml("cover");
    fs.writeFileSync(coverHtmlPath, buildHtml({
      inner: coverInner(cover), docTitle: cover.title, dark: args.dark,
      bgStrength: 1.8, // the cover carries a stronger texture than the body
    }), "utf8");
    const coverPdf = outPath + ".cover.pdf";
    // No footer, no page number — the cover is not part of the count.
    await renderPdf(chrome, coverHtmlPath, coverPdf, { dark: args.dark });
    // Prepend the cover to the content (zero-dep PDF concat).
    fs.writeFileSync(outPath, concatPdfs(fs.readFileSync(coverPdf), fs.readFileSync(contentPdf)));
    try { fs.unlinkSync(coverPdf); } catch {}
    try { fs.unlinkSync(contentPdf); } catch {}
  }

  // Make the text copy-pasteable. Chrome on macOS emits each glyph as its own
  // positioned show op (Type3 fonts), which macOS Preview/PDFKit can't
  // reassemble into words — copy splits and drops letters mid-word. Coalesce
  // the per-glyph runs into TJ arrays so viewers read whole words.
  if (!process.env.TOPDF_NOCOAL) try {
    fs.writeFileSync(outPath, coalesceGlyphRuns(fs.readFileSync(outPath)));
  } catch (e) {
    process.stderr.write(`to-pdf: text-coalesce skipped (${e.message})\n`);
  }

  if (args.keepHtml) {
    process.stdout.write(`html: ${contentHtmlPath}\n`);
    if (coverHtmlPath) process.stdout.write(`html: ${coverHtmlPath}\n`);
  } else {
    try { fs.unlinkSync(contentHtmlPath); } catch {}
    if (coverHtmlPath) { try { fs.unlinkSync(coverHtmlPath); } catch {} }
  }

  process.stdout.write(`${outPath}\n`);
}

// Decide the cover content. Returns { title, subtitle, dateStr, dateRaw, body }.
// Frontmatter `title`/`subtitle`/`created|date` take precedence and leave the
// body untouched. With no frontmatter title, a leading `# H1` is promoted as
// the title (and the first paragraph after it, if present, as the subtitle)
// and removed from the body. title === "" means "no cover".
function extractCover(content, data) {
  // The cover always carries a date: frontmatter `created`/`date` if given,
  // otherwise today (the render date) so a bare draft still gets one.
  const dateRaw = data.created || data.date || new Date().toISOString().slice(0, 10);
  const dateStr = formatDate(dateRaw);
  if (data.title) {
    return { title: data.title, subtitle: data.subtitle || "", dateStr, dateRaw, body: content };
  }
  const lines = content.split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  const h1 = lines[i] != null ? /^#\s+(.+?)\s*$/.exec(lines[i]) : null;
  if (!h1) return { title: "", subtitle: "", dateStr, dateRaw, body: content };
  const title = h1[1];
  let j = i + 1;
  while (j < lines.length && lines[j].trim() === "") j++;
  // A subtitle is the paragraph immediately after the H1 — only if it isn't
  // another heading, list, quote, code fence, or table.
  let subtitle = "";
  if (lines[j] != null && lines[j].trim() !== "" && !/^(#{1,6}\s|[-*+>|]|\d+\.\s|```|~~~)/.test(lines[j].trim())) {
    const para = [];
    while (j < lines.length && lines[j].trim() !== "") para.push(lines[j++]);
    subtitle = para.join(" ").trim();
  }
  const body = lines.slice(j).join("\n").replace(/^\n+/, "");
  return { title, subtitle, dateStr, dateRaw, body };
}

// Concatenate two Chrome-produced PDFs (cover first) with no external deps.
// Chrome emits clean PDF 1.4 with classic xref tables (no object/xref
// streams), so we can: renumber the content's objects past the cover's,
// rewrite its references, give each file's page-tree root a shared parent,
// and emit one new root Pages node + Catalog. Operates on latin1 strings
// (1 char == 1 byte) so binary streams pass through untouched.
function concatPdfs(coverBuf, contentBuf) {
  const parse = (buf) => {
    const s = buf.toString("latin1");
    const sx = parseInt(s.slice(s.lastIndexOf("startxref") + 9).trim().split(/\s/)[0], 10);
    const trailer = s.slice(s.lastIndexOf("trailer"));
    const root = +/\/Root\s+(\d+)\s+\d+\s+R/.exec(trailer)[1];
    // Parse the classic xref table → { objNum: byteOffset } for in-use objs.
    const offsets = new Map();
    let p = s.indexOf("\n", s.indexOf("xref", sx)) + 1;
    while (true) {
      const head = /^(\d+)\s+(\d+)\s*$/.exec(s.slice(p, s.indexOf("\n", p)));
      if (!head) break;
      let num = +head[1];
      const count = +head[2];
      p = s.indexOf("\n", p) + 1;
      for (let k = 0; k < count; k++, num++) {
        const entry = s.slice(p, p + 20);
        if (entry[17] === "n") offsets.set(num, parseInt(entry.slice(0, 10), 10));
        p += 20;
      }
      if (s.slice(p, p + 7) === "trailer") break;
    }
    // Slice each object body by walking consecutive offsets.
    const sorted = [...offsets.entries()].sort((a, b) => a[1] - b[1]);
    const objs = new Map();
    for (let k = 0; k < sorted.length; k++) {
      const [num, start] = sorted[k];
      const end = k + 1 < sorted.length ? sorted[k + 1][1] : sx;
      const chunk = s.slice(start, end);
      objs.set(num, chunk.slice(0, chunk.lastIndexOf("endobj") + 6));
    }
    const maxNum = Math.max(...offsets.keys());
    const catalog = objs.get(root);
    const pagesNum = +/\/Pages\s+(\d+)\s+\d+\s+R/.exec(catalog)[1];
    const count = +/\/Count\s+(\d+)/.exec(objs.get(pagesNum))[1];
    return { objs, maxNum, pagesNum, count };
  };

  // Replace indirect references "N 0 R" only in the dict portion of an object
  // (never inside a binary stream), shifting them by `off`.
  const shiftRefs = (chunk, off) => {
    const si = chunk.indexOf("stream");
    const head = si < 0 ? chunk : chunk.slice(0, si);
    const tail = si < 0 ? "" : chunk.slice(si);
    return head.replace(/\b(\d+)\s+0\s+R\b/g, (_, n) => `${+n + off} 0 R`) + tail;
  };
  const renumber = (chunk, off) =>
    shiftRefs(chunk.replace(/^\s*(\d+)\s+0\s+obj/, (_, n) => `${+n + off} 0 obj`), off);
  // Add /Parent to a (flat) Pages-root dict, before its closing >>endobj.
  const addParent = (chunk, parentNum) =>
    chunk.replace(/>>\s*endobj\s*$/, `\n/Parent ${parentNum} 0 R>>\nendobj`);

  const cov = parse(coverBuf);
  const con = parse(contentBuf);
  const off = cov.maxNum; // content nums shifted past the cover's
  const conPagesNum = con.pagesNum + off;
  const rootPagesNum = off + con.maxNum + 1;
  const catalogNum = rootPagesNum + 1;

  const out = new Map();
  for (const [num, chunk] of cov.objs) {
    out.set(num, num === cov.pagesNum ? addParent(chunk, rootPagesNum) : chunk);
  }
  for (const [num, chunk] of con.objs) {
    const shifted = renumber(chunk, off);
    out.set(num + off, (num === con.pagesNum) ? addParent(shifted, rootPagesNum) : shifted);
  }
  out.set(rootPagesNum, `${rootPagesNum} 0 obj\n<</Type /Pages\n/Count ${cov.count + con.count}\n/Kids [${cov.pagesNum} 0 R ${conPagesNum} 0 R]>>\nendobj`);
  out.set(catalogNum, `${catalogNum} 0 obj\n<</Type /Catalog\n/Pages ${rootPagesNum} 0 R>>\nendobj`);

  // Serialize with a fresh xref table.
  const size = catalogNum + 1;
  let body = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
  const at = new Map();
  for (let n = 1; n < size; n++) {
    const chunk = out.get(n);
    if (!chunk) continue;
    at.set(n, body.length);
    body += chunk + "\n";
  }
  const xrefAt = body.length;
  let xref = `xref\n0 ${size}\n0000000000 65535 f \n`;
  for (let n = 1; n < size; n++) {
    xref += at.has(n)
      ? `${String(at.get(n)).padStart(10, "0")} 00000 n \n`
      : "0000000000 00000 f \n";
  }
  body += xref + `trailer\n<</Size ${size}\n/Root ${catalogNum} 0 R>>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}

// Count pages in a Chrome-produced PDF, zero-dep. Chrome writes compressed
// object streams, so a raw grep misses the page objects — inflate every
// FlateDecode stream first, then count `/Type /Page` leaf objects. Falls
// back to the largest `/Count` (the page-tree root) and finally to null so
// the caller can degrade to a height estimate.
function countPdfPages(pdfPath) {
  try {
    const buf = fs.readFileSync(pdfPath);
    const latin = buf.toString("latin1");
    let inflated = "";
    const re = /stream\r?\n/g;
    let m;
    while ((m = re.exec(latin)) !== null) {
      const start = m.index + m[0].length;
      const end = latin.indexOf("endstream", start);
      if (end < 0) continue;
      const chunk = buf.subarray(start, end);
      // zlib streams start with a 0x78 CMF byte.
      if (chunk[0] === 0x78) {
        try { inflated += zlib.inflateSync(chunk).toString("latin1"); } catch {}
      }
    }
    const all = latin + "\n" + inflated;
    const leaf = (all.match(/\/Type\s*\/Page(?![a-zA-Z])/g) || []).length;
    if (leaf > 0) return leaf;
    const counts = [...all.matchAll(/\/Count\s+(\d+)/g)].map((x) => +x[1]);
    if (counts.length) return Math.max(...counts);
    return null;
  } catch {
    return null;
  }
}

// ─── native print footer ────────────────────────────────────────────────────

// GE mark sized for the native print footer. The page's CSS and @font-face
// don't reach the footer-template context, so size + colour are inline and
// the text falls back to system sans.
const FOOTER_LOGO = LOGO_SVG.replace(
  'class="mark"',
  'width="9" height="9" style="display:block"',
);

// Chrome native-footer template: brand on the left, "n / total" centred,
// domain on the right — the running footer drawn on every page. Chrome fills
// the pageNumber/totalPages spans. When showNumber is false (single-page
// docs, or --no-page-numbers) the centre slot is empty but the brand still
// prints. Horizontal padding (108px) aligns the brand/domain with the
// centred 36rem text column and the first-page header.
function footerTemplate({ dark = false, showNumber = true } = {}) {
  const divider = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const num = showNumber
    ? `<span style="justify-self:center;letter-spacing:0.6px;font-variant-numeric:tabular-nums;"><span class="pageNumber"></span> / <span class="totalPages"></span></span>`
    : "<span></span>";
  // 3-column grid (1fr | auto | 1fr) — equal side columns keep the centre
  // cell at the true page centre regardless of the brand/domain widths.
  // (flex space-between would shift it toward the narrower side.)
  return (
    `<div style="width:100%;margin:0;padding:0 108px;box-sizing:border-box;` +
    `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;` +
    `font-size:8px;font-weight:450;letter-spacing:0.2px;color:#737373;` +
    `-webkit-print-color-adjust:exact;print-color-adjust:exact;">` +
    `<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:center;` +
    `border-top:1px solid ${divider};padding-top:6px;">` +
    `<span style="justify-self:start;display:inline-flex;align-items:center;gap:5px;">${FOOTER_LOGO}<span>Gustav Ekberg</span></span>` +
    num +
    `<span style="justify-self:end;">gustav.im</span>` +
    `</div></div>`
  );
}

// ─── render (Chrome DevTools Protocol) ───────────────────────────────────────

// Render htmlPath → outPath via CDP Page.printToPDF. CDP (not the
// --print-to-pdf CLI flag) is required because only it exposes
// displayHeaderFooter + footerTemplate — the one reliable way to get a
// correct running footer on every printed page. Margins are zero except a
// bottom band that holds the footer; the full-bleed html background still
// paints across it (printBackground), so the edge-to-edge texture survives.
// Zero-dep: drives Chrome over its debug WebSocket using Node's global
// WebSocket (Node >= 22).
function renderPdf(chrome, htmlPath, outPath, { dark = false, hasMermaid = false, footerTemplate: footer }) {
  return new Promise((resolve, reject) => {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "to-pdf-chrome-"));
    const proc = spawn(
      chrome,
      [
        "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
        "--no-first-run", "--no-default-browser-check",
        "--disable-background-networking", "--disable-default-apps",
        "--disable-extensions", "--disable-sync", "--disable-translate",
        "--mute-audio", "--remote-debugging-port=0",
        `--user-data-dir=${userDataDir}`, "about:blank",
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );

    let settled = false;
    let ws = null;
    const stderrChunks = [];
    const hardTimer = setTimeout(
      () => finish(new Error(`chrome hung past 60s\n${Buffer.concat(stderrChunks).toString()}`)),
      60_000,
    );

    function finish(err) {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimer);
      try { if (ws) ws.close(); } catch {}
      try { if (!proc.killed) proc.kill("SIGKILL"); } catch {}
      try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
      if (err) reject(err);
      else resolve();
    }

    proc.on("error", (e) => finish(e));
    proc.on("exit", () => {
      if (!settled) finish(new Error(`chrome exited early\n${Buffer.concat(stderrChunks).toString()}`));
    });

    // Chrome prints "DevTools listening on ws://..." to stderr once ready.
    let buf = "";
    proc.stderr.on("data", (b) => {
      stderrChunks.push(b);
      if (ws) return;
      buf += b.toString();
      const m = buf.match(/ws:\/\/\S+/);
      if (m) connect(m[0]).catch(finish);
    });

    async function connect(wsURL) {
      ws = new WebSocket(wsURL);
      let id = 0;
      const pending = new Map();
      const events = new Map(); // one-shot event method -> resolver
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id && pending.has(msg.id)) {
          const { resolve: r, reject: j } = pending.get(msg.id);
          pending.delete(msg.id);
          if (msg.error) j(new Error(msg.error.message));
          else r(msg.result);
        } else if (msg.method && events.has(msg.method)) {
          events.get(msg.method)();
          events.delete(msg.method);
        }
      };
      const send = (method, params = {}, sessionId) =>
        new Promise((r, j) => {
          const i = ++id;
          pending.set(i, { resolve: r, reject: j });
          ws.send(JSON.stringify({ id: i, method, params, sessionId }));
        });
      const once = (method, ms) =>
        new Promise((r) => {
          events.set(method, r);
          if (ms) setTimeout(r, ms);
        });
      await new Promise((r, j) => {
        ws.onopen = r;
        ws.onerror = () => j(new Error("devtools websocket error"));
      });

      const { targetId } = await send("Target.createTarget", { url: "about:blank" });
      const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
      await send("Page.enable", {}, sessionId);
      await send("Runtime.enable", {}, sessionId);

      const loaded = once("Page.loadEventFired", 20_000);
      await send("Page.navigate", { url: `file://${htmlPath}` }, sessionId);
      await loaded;

      // Wait for embedded fonts so Satoshi metrics drive pagination.
      await send("Runtime.evaluate", {
        expression: "document.fonts.ready.then(()=>document.fonts.size)",
        awaitPromise: true,
      }, sessionId).catch(() => {});

      // Mermaid renders async after fetching its module from the CDN; wait
      // until every diagram has an <svg> (or give up after a budget).
      if (hasMermaid) {
        await send("Runtime.evaluate", {
          expression:
            "new Promise(res=>{const t=Date.now();(function c(){" +
            "const ds=[...document.querySelectorAll('pre.mermaid')];" +
            "if((ds.length&&ds.every(d=>d.querySelector('svg')))||Date.now()-t>15000)return res(1);" +
            "setTimeout(c,100);})();})",
          awaitPromise: true,
        }, sessionId).catch(() => {});
      }

      // A4 in inches. With a footer, marginBottom reserves its band; without
      // one (the cover) all margins are zero so the page fills edge to edge.
      // Either way printBackground keeps the texture full-bleed.
      const withFooter = !!footer;
      const res = await send("Page.printToPDF", {
        paperWidth: 8.2677,
        paperHeight: 11.6929,
        marginTop: 0,
        marginBottom: withFooter ? 0.62 : 0,
        marginLeft: 0,
        marginRight: 0,
        printBackground: true,
        displayHeaderFooter: withFooter,
        headerTemplate: "<span></span>",
        footerTemplate: withFooter ? footer : "<span></span>",
      }, sessionId);

      fs.writeFileSync(outPath, Buffer.from(res.data, "base64"));
      finish();
    }
  });
}

// Coalesce per-glyph text-show operators into TJ runs so macOS PDFKit (Preview)
// can copy whole words. Chrome on macOS embeds Type3 fonts and emits every
// glyph as its own positioned `<G> Tj`; PDFKit then guesses word boundaries
// from glyph gaps and gets them wrong (splitting/dropping letters). We merge
// each run of glyphs into `[<G> kern <G> ...] TJ`, where kern = font advance
// width − original offset, so the on-page layout is unchanged but the text is
// one coherent run. Zero-dep (node:zlib); operates on latin1 so binary passes
// through untouched; rebuilds the xref since stream lengths change.
function coalesceGlyphRuns(buf) {
  const s = buf.toString("latin1");
  const sxRaw = s.slice(s.lastIndexOf("startxref") + 9).trim().split(/\s/)[0];
  const sx = parseInt(sxRaw, 10);
  if (!Number.isFinite(sx)) return buf;

  // Classic xref → in-use object byte offsets.
  const offsets = new Map();
  let p = s.indexOf("\n", s.indexOf("xref", sx)) + 1;
  while (p > 0) {
    const head = /^(\d+)\s+(\d+)\s*$/.exec(s.slice(p, s.indexOf("\n", p)));
    if (!head) break;
    let num = +head[1];
    const count = +head[2];
    p = s.indexOf("\n", p) + 1;
    for (let k = 0; k < count; k++, num++) {
      if (s.slice(p, p + 20)[17] === "n") offsets.set(num, parseInt(s.slice(p, p + 10), 10));
      p += 20;
    }
    if (s.slice(p, p + 7) === "trailer") break;
  }
  if (offsets.size === 0) return buf;
  const trailer = s.slice(s.lastIndexOf("trailer"));
  const rootM = /\/Root\s+(\d+)\s+\d+\s+R/.exec(trailer);
  const infoM = /\/Info\s+(\d+)\s+\d+\s+R/.exec(trailer);

  const sorted = [...offsets.entries()].sort((a, b) => a[1] - b[1]);
  const objs = new Map();
  for (let k = 0; k < sorted.length; k++) {
    const [num, start] = sorted[k];
    const end = k + 1 < sorted.length ? sorted[k + 1][1] : sx;
    objs.set(num, s.slice(start, s.lastIndexOf("endobj", end) + 6));
  }

  const fontCache = new Map();
  const fontWidths = (n) => {
    if (fontCache.has(n)) return fontCache.get(n);
    const o = objs.get(n) || "";
    const fc = /\/FirstChar\s+(\d+)/.exec(o);
    const wm = /\/Widths\s*\[([\s\S]*?)\]/.exec(o);
    // Type3 /Widths are in glyph space; the text-space advance is
    // width * FontMatrix[0] * fontSize. Body fonts use .001, but the
    // monospace code font uses 1/2048 (.000488…) — assuming .001 makes its
    // advance ~2x too big and the kerning piles glyphs on top of each other.
    const fmm = /\/FontMatrix\s*\[\s*([\d.]+)/.exec(o);
    const fm = fmm ? parseFloat(fmm[1]) : 0.001;
    const res = fc && wm ? { first: +fc[1], widths: wm[1].trim().split(/\s+/).map(Number), fm } : null;
    fontCache.set(n, res);
    return res;
  };
  // Page → { fontName: widths }. Resources may be inline or an indirect ref.
  const resolveRes = (chunk) => {
    const ref = /\/Resources\s+(\d+)\s+0\s+R/.exec(chunk);
    return ref ? objs.get(+ref[1]) || chunk : chunk;
  };
  const fontMap = (chunk) => {
    const res = resolveRes(chunk);
    const fd = /\/Font\s*<<([\s\S]*?)>>/.exec(res);
    const map = {};
    if (fd) for (const m of fd[1].matchAll(/\/(\w+)\s+(\d+)\s+0\s+R/g)) {
      const w = fontWidths(+m[2]);
      if (w) map[m[1]] = w;
    }
    return map;
  };
  // Returns the glyph's advance in 1/1000-em units (so it's directly
  // comparable to dx*1000/sz), normalising for the font's FontMatrix scale.
  const widthOf = (fmap, name, code) => {
    const f = fmap[name];
    if (!f) return 500;
    const w = f.widths[code - f.first];
    return (Number.isFinite(w) ? w : 500) * f.fm * 1000;
  };
  // Total advance of a glyph-show string, which may pack several 1-byte glyph
  // codes (e.g. `<4669>` = two glyphs "Fi"). The renderer advances by the sum
  // of their widths, so kerning must use the sum — otherwise the glyph after a
  // multi-glyph string is misplaced (a visible gap mid-word, e.g. "Fi ndings").
  const advanceOf = (fmap, name, hex) => {
    let total = 0;
    for (let i = 0; i + 1 < hex.length; i += 2) total += widthOf(fmap, name, parseInt(hex.slice(i, i + 2), 16));
    return total;
  };

  const transform = (text, fmap) => {
    const lines = text.split("\n");
    const out = [];
    let curFont = null;
    let size = 16;
    const reTf = /^\/(\w+)\s+([\d.]+)\s+Tf$/;
    const reG0 = /^<([0-9A-Fa-f]+)>\s*Tj$/;
    const reGt = /^([-\d.]+)\s+0\s+Td\s*<([0-9A-Fa-f]+)>\s*Tj$/;
    const reBdc = /^\/\w+<<[\s\S]*>>\s+BDC$/;
    const reEmc = /^EMC$/;
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      const g0 = reG0.exec(t);
      const gt = reGt.exec(t);
      // Only coalesce body/heading text (>= 10pt). The small native print
      // footer (8pt brand + page number) is left exactly as Chrome rendered
      // it — its multi-font/positioning structure doesn't round-trip cleanly
      // and it's not meaningful copy text anyway.
      if ((g0 || gt) && size >= 10) {
        const seq = [];
        let f = curFont;
        let sz = size;
        seq.push(
          g0
            ? { kind: "glyph", font: f, size: sz, dx: null, code: g0[1] }
            : { kind: "glyph", font: f, size: sz, dx: parseFloat(gt[1]), code: gt[2] },
        );
        let j = i + 1;
        for (; j < lines.length; j++) {
          const tt = lines[j].trim();
          const ff = reTf.exec(tt);
          if (ff) { f = ff[1]; sz = parseFloat(ff[2]); continue; }
          if (reBdc.test(tt) || reEmc.test(tt)) { seq.push({ kind: "raw", line: lines[j] }); continue; }
          const ggg = reG0.exec(tt);
          if (ggg) { seq.push({ kind: "glyph", font: f, size: sz, dx: null, code: ggg[1] }); continue; }
          const gg = reGt.exec(tt);
          if (gg) { seq.push({ kind: "glyph", font: f, size: sz, dx: parseFloat(gg[1]), code: gg[2] }); continue; }
          break;
        }
        // Only coalesce when every glyph uses a known 1-byte Type3 font (in
        // fmap with /Widths). Mixed/unknown fonts — notably the Type0
        // Identity-H monospace used for `code` (2-byte codes, widths in a
        // descendant /W array) — don't fit this model, so leave the whole
        // sequence exactly as Chrome rendered it (visually correct).
        const glyphs = seq.filter((g) => g.kind === "glyph");
        const known = glyphs.every((g) => fmap[g.font]);
        if (glyphs.length > 1 && known) {
          // `Td` advances the text line matrix; bare `Tj` only advances the
          // text matrix. Ligature spans often use bare `Tj`, so derive each
          // glyph's real origin before converting the run to TJ kerning.
          let lineX = 0;
          let textX = 0;
          for (const item of glyphs) {
            if (item.dx !== null) lineX += item.dx;
            item.origin = item.dx === null ? textX : lineX;
            textX = item.origin + (advanceOf(fmap, item.font, item.code) * item.size) / 1000;
          }
          let prev = null;
          let arr = null;
          let activeFont = null;
          let activeSize = null;
          const flush = () => {
            if (!arr) return;
            out.push(arr + "] TJ");
            arr = null;
            activeFont = null;
            activeSize = null;
          };
          for (const item of seq) {
            if (item.kind === "raw") {
              flush();
              out.push(item.line);
              continue;
            }
            if (arr && (activeFont !== item.font || activeSize !== item.size)) flush();
            if (!arr) {
              out.push(`/${item.font} ${item.size} Tf`);
              arr = "[";
              activeFont = item.font;
              activeSize = item.size;
            }
            if (prev) {
              const prevAdvance = (advanceOf(fmap, prev.font, prev.code) * prev.size) / 1000;
              arr += (((prevAdvance - (item.origin - prev.origin)) * 1000) / item.size).toFixed(1);
            }
            arr += `<${item.code}>`;
            prev = item;
          }
          flush();
          // Chrome's per-glyph `dx 0 Td` advanced the *line matrix* to the end
          // of the line; a TJ only moves the text position. Re-apply the total
          // advance as one Td so the next line-break Td/Tm lands correctly —
          // otherwise continuation lines overlap the line above.
          const totalDx = lineX;
          if (totalDx) out.push(`${totalDx.toFixed(3)} 0 Td`);
          if (prev) curFont = prev.font;
          size = sz;
          i = j - 1;
          continue;
        }
        if (glyphs.length > 1) {
          // Unknown-font sequence (e.g. inline code) — emit verbatim.
          for (let q = i; q < j; q++) out.push(lines[q]);
          curFont = f;
          size = sz;
          i = j - 1;
          continue;
        }
      }
      const fm = reTf.exec(t);
      if (fm) { curFont = fm[1]; size = parseFloat(fm[2]); }
      out.push(lines[i]);
    }
    return out.join("\n");
  };

  // Map content-stream object → its page's font widths.
  const streamFonts = new Map();
  for (const [, chunk] of objs) {
    if (!/\/Type\s*\/Page(?![a-zA-Z])/.test(chunk)) continue;
    const fmap = fontMap(chunk);
    const one = /\/Contents\s+(\d+)\s+0\s+R/.exec(chunk);
    if (one) streamFonts.set(+one[1], fmap);
    const arr = /\/Contents\s*\[([^\]]*)\]/.exec(chunk);
    if (arr) for (const m of arr[1].matchAll(/(\d+)\s+0\s+R/g)) streamFonts.set(+m[1], fmap);
  }

  let changed = false;
  for (const [num, fmap] of streamFonts) {
    const chunk = objs.get(num);
    if (!chunk) continue;
    const si = chunk.indexOf("stream");
    if (si < 0) continue;
    const head = chunk.slice(0, si);
    const lenM = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(head);
    if (!lenM) continue; // indirect length — skip (Chrome uses direct)
    let ds = si + 6;
    if (chunk[ds] === "\r") ds++;
    if (chunk[ds] === "\n") ds++;
    const bytes = Buffer.from(chunk.slice(ds, ds + +lenM[1]), "latin1");
    if (bytes[0] !== 0x78) continue; // not zlib
    let dec;
    try { dec = zlib.inflateSync(bytes).toString("latin1"); } catch { continue; }
    if (!/\bTj$|\bTj\b/m.test(dec)) continue;
    const nt = transform(dec, fmap);
    if (nt === dec) continue;
    const comp = zlib.deflateSync(Buffer.from(nt, "latin1"));
    objs.set(
      num,
      head.replace(/\/Length\s+\d+/, `/Length ${comp.length}`) +
        "stream\n" + comp.toString("latin1") + "\nendstream\nendobj",
    );
    changed = true;
  }
  if (!changed) return buf;

  // Re-serialize with a fresh xref.
  const maxNum = Math.max(...objs.keys());
  let body = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
  const at = new Map();
  for (let n = 1; n <= maxNum; n++) {
    const chunk = objs.get(n);
    if (!chunk) continue;
    at.set(n, body.length);
    body += chunk + "\n";
  }
  const xrefAt = body.length;
  const sizeN = maxNum + 1;
  let xref = `xref\n0 ${sizeN}\n0000000000 65535 f \n`;
  for (let n = 1; n < sizeN; n++) {
    xref += at.has(n) ? `${String(at.get(n)).padStart(10, "0")} 00000 n \n` : "0000000000 00000 f \n";
  }
  body += xref + `trailer\n<</Size ${sizeN}` +
    (rootM ? `\n/Root ${rootM[1]} 0 R` : "") +
    (infoM ? `\n/Info ${infoM[1]} 0 R` : "") +
    `>>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return Buffer.from(body, "latin1");
}

main().catch((e) => {
  process.stderr.write(`to-pdf: ${e.message || e}\n`);
  process.exit(1);
});
