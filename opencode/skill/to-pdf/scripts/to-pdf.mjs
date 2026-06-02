#!/usr/bin/env node
// to-pdf — markdown → PDF, styled like gustav.im. Zero external deps.
//
// Usage:
//   node to-pdf.mjs <file.md> [--out <path>] [--keep-html]

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const HELP = `to-pdf — markdown → PDF, gustav.im style

Usage:
  to-pdf <file.md> [--dark] [--out <path>] [--keep-html]

Options:
  --dark         Render in dark mode (gustav.im dark palette).
                 Default output then becomes <basename>-dark.pdf.
  --out <path>   Output PDF path (overrides default sibling location)
  --keep-html    Keep intermediate HTML in /tmp and print its path
  -h, --help     Show this help

Env:
  GUSTAV_IM_ROOT  Override path to gustav.im checkout (default: ~/code/gustav.im)
`;

// ─── args ──────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = { _: [], out: null, keepHtml: false, dark: false };
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
    const olm = line.match(/^\d+\.\s+(.*)$/);
    if (ulm || olm) {
      const ordered = !!olm;
      const items = [];
      const re = ordered ? /^\d+\.\s+(.*)$/ : /^[-*+]\s+(.*)$/;
      while (i < lines.length) {
        const m = lines[i].match(re);
        if (!m) break;
        items.push(`<li>${inlineMd(m[1])}</li>`);
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.join("")}</${tag}>`);
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

function generateBackgroundSvg({ dark = false, width = 800, height = 1200 } = {}) {
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
  const lineMax = dark ? 0.07 : 0.05;
  const dotAlpha = dark ? 0.11 : 0.08;
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
          `<line x1="${nodes[i].x.toFixed(1)}" y1="${nodes[i].y.toFixed(1)}" x2="${nodes[j].x.toFixed(1)}" y2="${nodes[j].y.toFixed(1)}" stroke="${blend(a)}" stroke-width="0.5"/>`,
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
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice">${lines.join("")}${circles}</svg>`;
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

function buildHtml({ title, dateRaw, dateStr, author, bodyHtml, dark = false, hasMermaid = false }) {
  const svg = generateBackgroundSvg({ dark });
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
<title>${escapeHtml(title)}</title>
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

/* html bg fills the page sheet edge-to-edge (chrome paints html background
 * across the full canvas, including any @page margin area). body adds the
 * per-page reading inset via padding.
 *
 * height: 100% on html + body propagates the @page sheet height down to
 * .page so its min-height: 100% resolves to one A4 page — necessary for
 * the absolute footer to land at the page floor on single-page docs. */
html {
  height: 100%;
  background-color: var(--background);
  background-image: url("data:image/svg+xml;base64,${svgB64}");
  background-repeat: repeat-y;
  background-size: 100% auto;
  background-position: top center;
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

/* The wrapper carries per-page padding. box-decoration-break: clone asks
 * chrome to repeat the box's padding at every page-fragment boundary so
 * pages 2..N also get a top/bottom inset (not only the first/last).
 *
 * min-height: 100vh + position: relative make this the positioning
 * context for the absolutely-pinned doc-footer (see below). On a
 * single-page document this guarantees the footer lands at the bottom
 * of the page; on multi-page documents the footer rides the bottom of
 * .page (i.e. after the last content block on the last page). */
.page {
  position: relative;
  padding: 3cm 1.8cm;
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  /* min-height is set by the inline boot script below — measures the
   * natural content height, rounds up to the nearest A4 page, and
   * stretches .page to that exact pixel total. With min-height fixed
   * to a page-height multiple, the absolutely-positioned footer lands
   * at the bottom of the last printed page regardless of doc length. */
}

article {
  max-width: 36rem;
  margin: 0 auto;
  width: 100%;
  padding: 0 0 5rem;  /* room for the absolute footer */
}

h1.title {
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.01em;
  margin: 0 0 0.5rem;
  color: var(--grey-900);
}

time.date {
  display: block;
  font-size: 0.875rem;
  color: var(--grey-500);
  margin-bottom: 2.25rem;
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

/* Header + footer share the same understated styling: small grey text,
 * logo-mark + name on the left, domain on the right. Header sits at
 * the top of <article> so it appears on page 1 only; footer is absolute
 * pinned to the last page's floor by the JS measurement above. */
.doc-header,
.doc-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  color: var(--grey-500);
  font-weight: 450;
}

.doc-header {
  padding-bottom: 0.85rem;
  margin-bottom: 2.25rem;
  border-bottom: 1px solid var(--divider);
}

.doc-footer {
  position: absolute;
  bottom: 2cm;
  left: 1.8cm;
  right: 1.8cm;
  padding-top: 0.9rem;
  border-top: 1px solid var(--divider);
  page-break-inside: avoid;
  break-inside: avoid;
}

.doc-header .brand,
.doc-footer .brand {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.doc-header .brand .mark,
.doc-footer .brand .mark {
  width: 14px;
  height: 14px;
  color: var(--grey-500);
}

.doc-header .domain,
.doc-footer .domain {
  color: inherit;
  text-decoration: none;
}

.doc-footer a {
  color: inherit;
  text-decoration: none;
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
<script>
  // Fragmented .page + CSS min-height: 100% doesn't reliably stretch
  // the wrapper to a full A4 in Chrome's headless print engine, so we
  // measure the natural content height and pin .page to the nearest
  // page-height multiple. After this runs, the absolute doc-footer at
  // bottom: 2cm lands at the floor of the last printed page on docs
  // of any length.
  //
  // Runs synchronously after a couple of animation frames — Promise-
  // based waits (document.fonts.ready) don't resolve under Chrome's
  // --virtual-time-budget clock, so we use raf chains instead.
  (function () {
    const CM = 96 / 2.54;
    const PAGE_PX = 29.7 * CM;          // A4 sheet height
    const PAD_PX = 6 * CM;              // 3cm top + 3cm bottom (clone)
    const CONTENT_PAGE_PX = PAGE_PX - PAD_PX; // 23.7cm per page of content
    function fitPage() {
      const page = document.querySelector(".page");
      if (!page) return;
      // Strip the one-time top+bottom padding off the natural height —
      // box-decoration-break: clone re-applies the same padding on
      // every fragment, so the *content* must be divided by the inner
      // page area (23.7cm), not the sheet height (29.7cm). Without
      // this correction multi-page docs land one page short.
      const total = page.getBoundingClientRect().height;
      const content = Math.max(0, total - PAD_PX);
      const pages = Math.max(1, Math.ceil(content / CONTENT_PAGE_PX));
      page.style.minHeight = pages * PAGE_PX + "px";
    }
    function later(fn) {
      requestAnimationFrame(() => requestAnimationFrame(fn));
    }
    // Exposed so the mermaid pass can re-measure after diagrams render
    // (async SVG injection changes content height and would otherwise
    // throw off pagination).
    window.__fitPage = () => later(fitPage);
    if (document.readyState === "complete") {
      later(fitPage);
    } else {
      window.addEventListener("load", () => later(fitPage));
    }
  })();
</script>${
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
  if (window.__fitPage) window.__fitPage();
</script>`
    : ""
}
<div class="page">
<article>
  <header class="doc-header">
    <span class="brand">${LOGO_SVG}<span>Gustav Ekberg</span></span>
    <a class="domain" href="https://gustav.im">gustav.im</a>
  </header>
  ${
    title
      ? `<header>
    <h1 class="title">${inlineMd(title)}</h1>
    ${dateStr ? `<time class="date" datetime="${escapeHtml(dateRaw)}">${escapeHtml(dateStr)}</time>` : ""}
  </header>`
      : ""
  }
  <div class="prose">
${bodyHtml}
  </div>
</article>
<footer class="doc-footer">
  <span class="brand">${LOGO_SVG}<span>Gustav Ekberg</span></span>
  <a class="domain" href="https://gustav.im">gustav.im</a>
</footer>
</div>
</body>
</html>`;
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

  // Title + date come from frontmatter only — never inferred from the
  // filename or file mtime. If the user wants a header, they declare it
  // in `title:` / `created:`. Otherwise we let the body's first heading
  // act as the visual title.
  const title = data.title || "";
  const dateRaw = data.created || data.date || "";
  const dateStr = formatDate(dateRaw);
  const author = data.author || "";

  const bodyHtml = mdToHtml(content);
  const hasMermaid = /<pre class="mermaid">/.test(bodyHtml);
  const html = buildHtml({ title, dateRaw, dateStr, author, bodyHtml, dark: args.dark, hasMermaid });

  // HTML always lives in /tmp — only PDF goes sibling.
  const htmlPath = path.join(
    os.tmpdir(),
    `to-pdf-${Date.now()}-${path.basename(inputPath, ".md")}.html`,
  );
  fs.writeFileSync(htmlPath, html, "utf8");

  const chrome = findChrome();
  if (!chrome) {
    process.stderr.write(
      "to-pdf: chrome / chromium not found. Install Google Chrome or set CHROME_PATH.\n",
    );
    process.exit(1);
  }

  await runChrome(chrome, htmlPath, outPath, hasMermaid);

  if (args.keepHtml) {
    process.stdout.write(`html: ${htmlPath}\n`);
  } else {
    try {
      fs.unlinkSync(htmlPath);
    } catch {}
  }

  process.stdout.write(`${outPath}\n`);
}

// Spawn Chrome, wait for the PDF to be written, kill Chrome if it lingers.
// Chrome's headless print-to-pdf occasionally fails to exit cleanly on
// macOS even after the PDF is on disk; we watch for the file and tear
// down the process ourselves.
function runChrome(chrome, htmlPath, outPath, hasMermaid = false) {
  return new Promise((resolve, reject) => {
    const userDataDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "to-pdf-chrome-"),
    );
    // Mermaid renders async after fetching the library; give Chrome a
    // wider virtual-time budget so it prints after diagrams settle.
    const vtBudget = hasMermaid ? 20000 : 8000;

    // Wipe any previous output so we can detect a fresh write.
    try {
      fs.unlinkSync(outPath);
    } catch {}

    const proc = spawn(
      chrome,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--hide-scrollbars",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-sync",
        "--disable-translate",
        "--mute-audio",
        "--no-pdf-header-footer",
        `--user-data-dir=${userDataDir}`,
        `--print-to-pdf=${outPath}`,
        "--virtual-time-budget=8000",
        `file://${htmlPath}`,
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );

    const stderrChunks = [];
    proc.stderr.on("data", (b) => stderrChunks.push(b));

    const HARD_TIMEOUT_MS = 30_000;
    const POLL_MS = 200;
    const STABLE_MS = 600;

    let lastSize = -1;
    let stableSince = 0;
    let settled = false;

    function cleanup() {
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
      } catch {}
    }

    function finish(err) {
      if (settled) return;
      settled = true;
      clearInterval(poller);
      clearTimeout(hardTimer);
      if (!proc.killed) proc.kill("SIGTERM");
      setTimeout(() => {
        if (!proc.killed) proc.kill("SIGKILL");
        cleanup();
        if (err) reject(err);
        else resolve();
      }, 200);
    }

    proc.on("error", (e) => finish(e));
    proc.on("exit", () => {
      // Chrome exited on its own — confirm the PDF exists.
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) finish();
      else finish(new Error(`chrome exited without writing PDF\n${Buffer.concat(stderrChunks).toString()}`));
    });

    const poller = setInterval(() => {
      if (!fs.existsSync(outPath)) return;
      const size = fs.statSync(outPath).size;
      if (size <= 0) return;
      const now = Date.now();
      if (size !== lastSize) {
        lastSize = size;
        stableSince = now;
        return;
      }
      if (now - stableSince >= STABLE_MS) finish();
    }, POLL_MS);

    const hardTimer = setTimeout(() => {
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) finish();
      else
        finish(
          new Error(
            `chrome hung past ${HARD_TIMEOUT_MS}ms without writing PDF\n${Buffer.concat(stderrChunks).toString()}`,
          ),
        );
    }, HARD_TIMEOUT_MS);
  });
}

main().catch((e) => {
  process.stderr.write(`to-pdf: ${e.message || e}\n`);
  process.exit(1);
});
