import fs from "node:fs";
import path from "node:path";

export const SLIDE_TYPES = [
  "cover",
  "hero",
  "section",
  "divider",
  "body",
  "bullets",
  "compare",
  "stat",
  "quote",
  "closing",
];

const TYPE_ALIASES = new Map([
  ["bullet", "bullets"],
  ["bulletstatement", "bullets"],
  ["bodyparagraph", "body"],
  ["sectiondivider", "section"],
  ["closingcover", "closing"],
  ["category", "divider"],
  ["categorydivider", "divider"],
  ["categorybreak", "divider"],
]);

export const slugify = (value) => {
  const s = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.length > 0 ? s : "presentation";
};

export const stripMarkdown = (value) =>
  value
    .replace(/<!--[^]*?-->/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
    .replace(/^>\s*/gm, "")
    .trim();

const parseFrontmatter = (src) => {
  if (!src.startsWith("---\n") && !src.startsWith("---\r\n")) {
    return { data: {}, content: src };
  }
  const nl = src.startsWith("---\r\n") ? "\r\n" : "\n";
  const close = src.indexOf(`${nl}---${nl}`, 3 + nl.length);
  if (close === -1) return { data: {}, content: src };
  const yaml = src.slice(3 + nl.length, close);
  const data = {};
  for (const line of yaml.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    data[m[1]] = val;
  }
  return { data, content: src.slice(close + 3 + nl.length * 2) };
};

const normaliseKind = (raw) => {
  if (raw === null || raw === undefined) return null;
  const key = raw.replace(/[^a-zA-Z]/g, "").toLowerCase();
  const aliased = TYPE_ALIASES.get(key) ?? key;
  return SLIDE_TYPES.includes(aliased) ? aliased : null;
};

const listItems = (lines) =>
  lines
    .map((line) => line.match(/^\s*(?:[-*+] |\d+\.\s+)(.*)$/))
    .filter((m) => m !== null)
    .map((m) => stripMarkdown(m[1]))
    .filter(Boolean);

const paragraphs = (lines) => {
  const out = [];
  let buf = [];
  const flush = () => {
    const text = stripMarkdown(buf.join(" ").replace(/\s+/g, " "));
    if (text) out.push(text);
    buf = [];
  };
  for (const line of lines) {
    if (line.trim() === "") {
      flush();
      continue;
    }
    if (/^\s*(?:[-*+] |\d+\.\s+)/.test(line)) continue;
    if (/^#{3,}\s+/.test(line)) continue;
    buf.push(line);
  }
  flush();
  return out;
};

const quoteParts = (lines) => {
  const quoteLines = lines
    .filter((line) => /^>\s+/.test(line))
    .map((line) => line.replace(/^>\s+/, ""));
  const quote = stripMarkdown(quoteLines.join(" "));
  const attrLine = lines.find((line) => /^\s*(?:-|—|--|by )\s*/i.test(line.trim()));
  const attribution = attrLine ? stripMarkdown(attrLine.replace(/^\s*(?:-|—|--|by )\s*/i, "")) : "";
  return { quote, attribution };
};

const compareParts = (lines) => {
  const headings = [];
  let current = null;
  for (const line of lines) {
    const h = line.match(/^###\s+(.*)$/);
    if (h) {
      current = { label: stripMarkdown(h[1]), lines: [] };
      headings.push(current);
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (headings.length >= 2) {
    return {
      leftLabel: headings[0].label,
      leftBody: paragraphs(headings[0].lines).join("\n"),
      rightLabel: headings[1].label,
      rightBody: paragraphs(headings[1].lines).join("\n"),
    };
  }
  const bullets = listItems(lines);
  if (bullets.length >= 2) {
    const parse = (s, fallback) => {
      const m = s.match(/^([^:]+):\s*(.*)$/);
      return m ? { label: m[1].trim(), body: m[2].trim() } : { label: fallback, body: s };
    };
    const left = parse(bullets[0], "Today");
    const right = parse(bullets[1], "Tomorrow");
    return { leftLabel: left.label, leftBody: left.body, rightLabel: right.label, rightBody: right.body };
  }
  const p = paragraphs(lines);
  return { leftLabel: "Today", leftBody: p[0] ?? "", rightLabel: "Tomorrow", rightBody: p[1] ?? "" };
};

const inferKind = (section, index) => {
  const title = section.title.toLowerCase();
  if (index === 0 && /cover|title|intro/.test(title)) return "cover";
  if (/closing|thank|contact|next/.test(title)) return "closing";
  if (/^(part|chapter|category)\b/i.test(section.title.trim())) return "divider";
  if (quoteParts(section.lines).quote) return "quote";
  if (/^(~?\d|\d+[%x×]|[<>]\d)/.test(section.title.trim())) return "stat";
  if (/\b(vs|versus|from|to|today|tomorrow|before|after)\b/.test(title)) return "compare";
  if (listItems(section.lines).length >= 2) return "bullets";
  if (section.title.length <= 80 && paragraphs(section.lines).length <= 1 && index < 3) return "hero";
  return "body";
};

const sectionToSlide = (section, index) => {
  const kind = section.kind ?? inferKind(section, index);
  const ps = paragraphs(section.lines);
  const text = ps.join("\n");

  if (kind === "cover") return { kind, title: section.title, subtitle: ps[0] ?? "" };
  if (kind === "hero") return { kind, intro: section.title, conclusion: ps[0] ?? "" };
  if (kind === "section") {
    const m = section.title.match(/^([\w.]+)\s*[-:–—]\s*(.*)$/);
    return { kind, number: m ? m[1].replace(/\.$/, "") : String(index + 1).padStart(2, "0"), label: m ? stripMarkdown(m[2]) : section.title };
  }
  if (kind === "divider") {
    // "02 — Foundations" / "Part Two: Foundations" → eyebrow + label;
    // a bare title becomes the label with no eyebrow.
    const m = section.title.match(/^(.+?)\s*[-:–—]\s+(.*)$/);
    return {
      kind,
      eyebrow: m ? stripMarkdown(m[1]) : "",
      label: m ? stripMarkdown(m[2]) : section.title,
      caption: ps[0] ?? "",
    };
  }
  if (kind === "bullets") return { kind, heading: section.title, bullets: listItems(section.lines).slice(0, 8) };
  if (kind === "compare") return { kind, heading: section.title, ...compareParts(section.lines) };
  if (kind === "stat") return { kind, value: section.title, caption: text };
  if (kind === "quote") {
    const q = quoteParts(section.lines);
    return { kind, quote: q.quote || section.title, attribution: q.attribution || ps[0] || "" };
  }
  if (kind === "closing") return { kind, title: section.title, subtitle: ps[0] ?? "" };
  return { kind: "body", heading: section.title, body: text };
};

export const parseDeckMarkdown = (src, opts = {}) => {
  const { data, content } = parseFrontmatter(src);
  const lines = content.split(/\r?\n/);
  const h1 = lines.find((line) => /^#\s+/.test(line));
  const title = opts.title ?? data.title ?? (h1 ? stripMarkdown(h1.replace(/^#\s+/, "")) : "Presentation");
  const author = opts.author ?? data.author ?? "Gustav Ekberg";
  const sections = [];
  let pendingKind = null;
  let current = null;

  const push = () => {
    if (!current) return;
    current.lines = current.lines.filter((line) => !/^#\s+/.test(line));
    sections.push(current);
  };

  for (const line of lines) {
    const marker = line.match(/^\s*<!--\s*slide:\s*([a-zA-Z-]+)\s*-->\s*$/);
    if (marker) {
      pendingKind = normaliseKind(marker[1]);
      continue;
    }
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      push();
      let sectionTitle = h2[1].trim();
      const inlineKind = sectionTitle.match(/^\[([^\]]+)\]\s*(.*)$/);
      const kind = inlineKind ? normaliseKind(inlineKind[1]) : pendingKind;
      if (inlineKind) sectionTitle = inlineKind[2].trim();
      current = { kind, title: stripMarkdown(sectionTitle), lines: [] };
      pendingKind = null;
      continue;
    }
    if (current) current.lines.push(line);
  }
  push();

  const slides = sections.map(sectionToSlide).filter((slide) => slide !== null);
  if (!slides.some((slide) => slide.kind === "cover")) {
    slides.unshift({ kind: "cover", title, subtitle: opts.subtitle ?? "" });
  }
  if (!opts.noClosing && !slides.some((slide) => slide.kind === "closing")) {
    slides.push({ kind: "closing", title: "Let's talk.", subtitle: "gustav.im" });
  }
  return { title, author, slides };
};

export const resolveSources = (inputs, texts) => {
  const chunks = [];
  const files = [];
  for (const input of inputs) {
    const abs = path.resolve(input);
    if (fs.existsSync(abs)) {
      files.push(abs);
      chunks.push(fs.readFileSync(abs, "utf8"));
    } else {
      chunks.push(input);
    }
  }
  for (const text of texts) chunks.push(text);
  return { files, source: chunks.join("\n\n") };
};
