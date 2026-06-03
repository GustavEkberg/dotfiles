/**
 * Slide renderers + chrome.
 *
 * Owns the visual layer: shape/text XML primitives, the seeded signal-
 * flow background that mirrors gustav.im's canvas constellation, the
 * GE mark drawn from the same proportions as `components/logo.tsx`,
 * and one renderer per slide archetype.
 *
 * The OOXML zip envelope lives in `pptx-package.mjs`.
 */
import { Buffer } from "node:buffer";
import fs from "node:fs";

const EMU_PER_IN = 914400;
const EMU_PER_PT = 12700;

export const SLIDE_W = 13.333;
export const SLIDE_H = 7.5;
export const FONT = "Satoshi";

export const COLORS = {
  dark: "0A0A0A",
  ink: "171717",
  white: "FAFAFA",
  light: "FFFFFF",
  muted: "737373",
  soft: "E5E5E5",
  faint: "A3A3A3",
};

const xmlEscape = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const emu = (inch) => Math.round(inch * EMU_PER_IN);
const pt = (points) => Math.round(points * 100);
const lineWidth = (points) => Math.round(points * EMU_PER_PT);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const parseHex = (hex) => [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const toHex = (chs) =>
  chs.map((c) => clamp(Math.round(c), 0, 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const blend = (bg, fg, alpha) => {
  const b = parseHex(bg);
  const f = parseHex(fg);
  return toHex(b.map((c, i) => c + (f[i] - c) * alpha));
};

const hash = (value) => {
  let h = 2166136261;
  for (const ch of String(value)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const rng = (seed) => {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1000000) / 1000000;
  };
};

// ─── shape primitives ────────────────────────────────────────────────────

const fillXml = (fill) => (fill ? `<a:solidFill><a:srgbClr val="${xmlEscape(fill)}"/></a:solidFill>` : "<a:noFill/>");
const strokeXml = (line) =>
  line
    ? `<a:ln w="${lineWidth(line.width ?? 1)}"><a:solidFill><a:srgbClr val="${xmlEscape(line.color)}"/></a:solidFill></a:ln>`
    : `<a:ln><a:noFill/></a:ln>`;

const shapeXml = (id, preset, x, y, w, h, opts) => `
<p:sp>
  <p:nvSpPr><p:cNvPr id="${id}" name="Shape ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
  <p:spPr>
    <a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>
    <a:prstGeom prst="${preset}"><a:avLst/></a:prstGeom>
    ${fillXml(opts.fill)}
    ${strokeXml(opts.line)}
  </p:spPr>
</p:sp>`;

/**
 * Diagonal line via the `line` preset. PPTX line preset draws from the
 * top-left corner of the bbox to the bottom-right corner. When the real
 * pair runs top-right -> bottom-left, set flipV.
 */
const lineShapeXml = (id, x1, y1, x2, y2, opts) => {
  const minX = Math.min(x1, x2);
  const minY = Math.min(y1, y2);
  const w = Math.max(Math.abs(x2 - x1), 0.001);
  const h = Math.max(Math.abs(y2 - y1), 0.001);
  const flip = (x1 < x2) !== (y1 < y2);
  const flipAttr = flip ? ` flipV="1"` : "";
  const color = opts.color ?? COLORS.ink;
  const width = opts.width ?? 0.5;
  return `
<p:sp>
  <p:nvSpPr><p:cNvPr id="${id}" name="Line ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
  <p:spPr>
    <a:xfrm${flipAttr}><a:off x="${emu(minX)}" y="${emu(minY)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>
    <a:prstGeom prst="line"><a:avLst/></a:prstGeom>
    <a:noFill/>
    <a:ln w="${lineWidth(width)}" cap="rnd"><a:solidFill><a:srgbClr val="${xmlEscape(color)}"/></a:solidFill><a:round/></a:ln>
  </p:spPr>
</p:sp>`;
};

// Embedded picture. `relId` ties to a slide-rels <Relationship> + a
// ppt/media file written by the package layer; the renderer only emits the
// shape and records the media bytes (see SlideBuilder.picture).
const picXml = (id, relId, x, y, w, h) => `
<p:pic>
  <p:nvPicPr><p:cNvPr id="${id}" name="Picture ${id}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>
  <p:blipFill><a:blip r:embed="${relId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
  <p:spPr>
    <a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
  </p:spPr>
</p:pic>`;

// Sniff format + pixel dimensions straight from the file header — zero-dep,
// so the renderer can preserve aspect ratio without an image library.
// width/height 0 means "unknown" → caller falls back to 16:9.
const imageMeta = (buf) => {
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50) {
    return { ext: "png", width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.length > 10 && buf.toString("latin1", 0, 3) === "GIF") {
    return { ext: "gif", width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let o = 2;
    while (o + 9 < buf.length) {
      if (buf[o] !== 0xff) { o += 1; continue; }
      const marker = buf[o + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { ext: "jpg", height: buf.readUInt16BE(o + 5), width: buf.readUInt16BE(o + 7) };
      }
      o += 2 + buf.readUInt16BE(o + 2);
    }
    return { ext: "jpg", width: 0, height: 0 };
  }
  if (buf.length > 12 && buf.toString("latin1", 0, 4) === "RIFF" && buf.toString("latin1", 8, 12) === "WEBP") {
    return { ext: "webp", width: 0, height: 0 };
  }
  return { ext: "png", width: 0, height: 0 };
};

const runXml = (text, opts) =>
  `<a:r><a:rPr lang="en-US" sz="${pt(opts.fontSize ?? 18)}"${opts.bold ? ' b="1"' : ""}${opts.italic ? ' i="1"' : ""}` +
  `${opts.spacing ? ` spc="${opts.spacing}"` : ""}>` +
  `<a:solidFill><a:srgbClr val="${xmlEscape(opts.color ?? COLORS.ink)}"/></a:solidFill>` +
  `<a:latin typeface="${FONT}"/><a:cs typeface="${FONT}"/></a:rPr><a:t>${xmlEscape(text)}</a:t></a:r>`;

const paragraphXml = (line, opts) => {
  const align = opts.align ?? "l";
  // PPTX <a:spcPct> uses thousandths of a percent — 100000 = 100% line
  // height. Passing the multiplier × 1000 (previous bug) collapses every
  // wrapped line to ~1.3% spacing, stacking them on top of each other.
  const lnSpc =
    opts.lineSpacing !== undefined
      ? `<a:lnSpc><a:spcPct val="${Math.round(opts.lineSpacing * 100000)}"/></a:lnSpc>`
      : "";
  return `<a:p><a:pPr algn="${align}">${lnSpc}</a:pPr>${runXml(line, opts)}<a:endParaRPr lang="en-US" sz="${pt(opts.fontSize ?? 18)}"/></a:p>`;
};

const textXml = (id, value, x, y, w, h, opts) => {
  const lines = String(value ?? "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  const body = (lines.length > 0 ? lines : [""]).map((line) => paragraphXml(line, opts)).join("");
  const margin = emu(opts.margin ?? 0.02);
  const anchor = opts.valign === "middle" ? "ctr" : opts.valign === "bottom" ? "b" : "t";
  return `
<p:sp>
  <p:nvSpPr><p:cNvPr id="${id}" name="Text ${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
  <p:spPr>
    <a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm>
    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln>
  </p:spPr>
  <p:txBody><a:bodyPr wrap="square" anchor="${anchor}" lIns="${margin}" tIns="${margin}" rIns="${margin}" bIns="${margin}"/><a:lstStyle/>${body}</p:txBody>
</p:sp>`;
};

const slideXml = (shapes) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    ${shapes}
  </p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;

class SlideBuilder {
  constructor(index, title) {
    this.index = index;
    this.title = title;
    this.nextId = 2;
    this.shapes = [];
    // Per-slide image relationships. rId1 is the slide layout, so embedded
    // pictures start at rId2; the package layer turns these into
    // <Relationship> entries + ppt/media files.
    this.media = [];
    this.nextRel = 2;
  }
  id() {
    const id = this.nextId;
    this.nextId += 1;
    return id;
  }
  rect(x, y, w, h, opts = {}) {
    this.shapes.push(shapeXml(this.id(), "rect", x, y, w, h, opts));
  }
  roundRect(x, y, w, h, opts = {}) {
    this.shapes.push(shapeXml(this.id(), "roundRect", x, y, w, h, opts));
  }
  ellipse(x, y, w, h, opts = {}) {
    this.shapes.push(shapeXml(this.id(), "ellipse", x, y, w, h, opts));
  }
  line(x1, y1, x2, y2, opts = {}) {
    this.shapes.push(lineShapeXml(this.id(), x1, y1, x2, y2, opts));
  }
  text(value, x, y, w, h, opts = {}) {
    this.shapes.push(textXml(this.id(), value, x, y, w, h, opts));
  }
  picture(x, y, w, h, media) {
    const rel = `rId${this.nextRel}`;
    this.nextRel += 1;
    this.media.push({ rel, ext: media.ext, data: media.data });
    this.shapes.push(picXml(this.id(), rel, x, y, w, h));
  }
  toXml() {
    return slideXml(this.shapes.join(""));
  }
}

// ─── chrome: signal flow + GE mark + footer stamp ────────────────────────

/**
 * Constellation backdrop. Mirrors the proportions of
 * `gustav.im/components/signal-flow-background.tsx`: ~50 nodes drifting
 * across the slide, faint diagonal connections between any pair within a
 * proximity radius. Seeded by slide title + index so the deck stays
 * deterministic across renders but varies per slide.
 */
const drawSignal = (s, bg, fg, seedText) => {
  const isDark = bg === COLORS.dark || bg === COLORS.ink;
  const rand = rng(hash(`${seedText}:${s.index}`));
  const dotColor = blend(bg, fg, isDark ? 0.13 : 0.10);
  const radius = 1.45;
  const node = Array.from({ length: 50 }, () => ({
    x: rand() * SLIDE_W,
    y: rand() * SLIDE_H,
  }));
  let added = 0;
  for (let i = 0; i < node.length && added < 200; i += 1) {
    for (let j = i + 1; j < node.length && added < 200; j += 1) {
      const a = node[i];
      const b = node[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist >= radius || dist < 0.18) continue;
      const proximity = 1 - dist / radius;
      const alpha = (isDark ? 0.085 : 0.06) * proximity;
      s.line(a.x, a.y, b.x, b.y, {
        color: blend(bg, fg, alpha),
        width: 0.45,
      });
      added += 1;
    }
  }
  for (const n of node) s.ellipse(n.x - 0.025, n.y - 0.025, 0.05, 0.05, { fill: dotColor });
};

/**
 * GE mark. Geometry matches `gustav.im/components/logo.tsx` — rounded
 * rect on a 32×32 viewBox sitting at (4,5)–(28,27), a vertical divider
 * at x=16, G tongue from x=11 to x=16 at y=16, E bar from x=16 to x=24
 * at y=16. Rounding-only-on-left isn't expressible in a PPTX preset so
 * we use roundRect with moderate rounding throughout.
 */
const drawMark = (s, x, y, size, color, strokePt = 1.5) => {
  const rectX = x + (size * 4) / 32;
  const rectY = y + (size * 5) / 32;
  const rectW = (size * 24) / 32;
  const rectH = (size * 22) / 32;
  const midX = x + size / 2;
  const midY = y + (size * 16) / 32;
  const tongueX = x + (size * 11) / 32;
  const barX = x + (size * 24) / 32;
  s.roundRect(rectX, rectY, rectW, rectH, { fill: null, line: { color, width: strokePt } });
  s.line(midX, rectY, midX, rectY + rectH, { color, width: strokePt });
  s.line(tongueX, midY, midX, midY, { color, width: strokePt });
  s.line(midX, midY, barX, midY, { color, width: strokePt });
};

const stamp = (s, dark, pageNumber) => {
  const color = dark ? COLORS.white : COLORS.ink;
  drawMark(s, 0.55, 0.42, 0.3, color, 1.4);
  s.text("Gustav Ekberg", 0.98, 0.42, 2.8, 0.3, {
    fontSize: 9,
    color,
    bold: true,
    spacing: 30,
    valign: "middle",
    margin: 0,
  });
  s.text("gustav.im", 0.55, SLIDE_H - 0.52, 2.4, 0.28, {
    fontSize: 9,
    color,
    spacing: 30,
    margin: 0,
  });
  if (pageNumber > 1) {
    s.text(String(pageNumber).padStart(2, "0"), SLIDE_W - 1.0, SLIDE_H - 0.52, 0.45, 0.28, {
      fontSize: 9,
      color,
      align: "r",
      spacing: 30,
      margin: 0,
    });
  }
};

const surface = (s, color, dark, pageNumber) => {
  s.rect(0, 0, SLIDE_W, SLIDE_H, { fill: color });
  drawSignal(s, color, dark ? COLORS.white : COLORS.ink, s.title);
  stamp(s, dark, pageNumber);
};

// ─── archetype renderers ─────────────────────────────────────────────────

const safe = (value, fallback) => String(value ?? "").trim() || fallback;
const bodyFont = (text) => {
  const len = String(text ?? "").length;
  if (len > 480) return 16;
  if (len > 320) return 18;
  return 21;
};
const heroLeadFont = (text) => {
  const len = String(text ?? "").length;
  if (len > 120) return 36;
  if (len > 70) return 44;
  return 54;
};
const heroTailFont = (text) => {
  const len = String(text ?? "").length;
  if (len > 100) return 20;
  if (len > 60) return 24;
  return 28;
};

const renderCover = (s, slide) => {
  surface(s, COLORS.dark, true, 1);
  const title = safe(slide.title, "Presentation");
  // Title is top-anchored. Box must hold 2 lines at 54pt (~1.9") without
  // clipping into the subtitle below.
  s.text(title, 0.75, 1.95, 11.8, 2.4, {
    fontSize: heroLeadFont(title),
    color: COLORS.white,
    bold: true,
    margin: 0,
  });
  if (slide.subtitle) {
    s.text(slide.subtitle, 0.78, 4.65, 11.5, 1.0, {
      fontSize: 22,
      color: COLORS.soft,
      margin: 0,
    });
  }
};

const renderHero = (s, slide, page) => {
  surface(s, COLORS.dark, true, page);
  const intro = safe(slide.intro, "One sharp point.");
  // Lead is top-anchored. Box must accommodate 2 lines at 54pt (~1.9")
  // without spilling into the tail. Raise top, widen height.
  s.text(intro, 0.78, 1.9, 11.8, 2.4, {
    fontSize: heroLeadFont(intro),
    color: COLORS.white,
    bold: true,
    margin: 0,
  });
  if (slide.conclusion) {
    s.text(slide.conclusion, 0.8, 4.5, 11.5, 1.5, {
      fontSize: heroTailFont(slide.conclusion),
      color: COLORS.soft,
      margin: 0,
    });
  }
};

const renderSection = (s, slide, page) => {
  surface(s, COLORS.dark, true, page);
  const number = safe(slide.number, String(page).padStart(2, "0"));
  s.text(number, 0.55, 1.4, 4.0, 4.6, {
    fontSize: 160,
    color: blend(COLORS.dark, COLORS.white, 0.18),
    bold: true,
    margin: 0,
  });
  s.line(4.7, 1.8, 4.7, 5.8, { color: COLORS.white, width: 0.75 });
  s.text(safe(slide.label, "Section"), 5.05, 2.55, 7.7, 2.0, {
    fontSize: 38,
    color: COLORS.white,
    bold: true,
    margin: 0,
  });
};

/**
 * Category divider. Announces the next category of slides: a small spaced
 * eyebrow over a short accent rule, a large category label, and an optional
 * one-line caption of what's coming. Distinct from `section` (giant left
 * number for navigation) and `hero` (an argument beat) — this is a calm
 * category break, vertically centred on dark.
 */
const renderDivider = (s, slide, page) => {
  surface(s, COLORS.dark, true, page);
  const label = safe(slide.label, "Category");
  const hasEyebrow = Boolean(safe(slide.eyebrow, ""));
  let y = 2.85;
  if (hasEyebrow) {
    s.text(String(slide.eyebrow).toUpperCase(), 0.8, y, 11.5, 0.42, {
      fontSize: 14,
      color: COLORS.faint,
      bold: true,
      spacing: 120,
      margin: 0,
    });
    y += 0.62;
  }
  // Short accent rule above the label.
  s.line(0.82, y, 2.1, y, { color: blend(COLORS.dark, COLORS.white, 0.35), width: 1 });
  s.text(label, 0.78, y + 0.28, 11.9, 2.4, {
    fontSize: heroLeadFont(label),
    color: COLORS.white,
    bold: true,
    margin: 0,
  });
  if (slide.caption) {
    s.text(slide.caption, 0.8, y + 2.35, 11.4, 1.1, {
      fontSize: 22,
      color: COLORS.soft,
      margin: 0,
    });
  }
};

/**
 * Image slide. A light page with heading + optional caption at the top and
 * the picture fitted (aspect preserved) into the band below — for diagrams,
 * screenshots, org charts. The image is embedded in the PPTX, not linked.
 */
const renderImage = (s, slide, page) => {
  surface(s, COLORS.light, false, page);
  s.text(safe(slide.heading, ""), 0.78, 1.05, 11.8, 0.7, {
    fontSize: 28,
    color: COLORS.ink,
    bold: true,
    margin: 0,
  });
  const hasCaption = Boolean(safe(slide.caption, ""));
  if (hasCaption) {
    s.text(slide.caption, 0.8, 1.74, 11.5, 0.6, {
      fontSize: 14,
      color: COLORS.muted,
      margin: 0,
    });
  }
  const bandTop = hasCaption ? 2.4 : 2.0;
  const bandH = 6.75 - bandTop;
  const maxW = SLIDE_W - 1.2;
  let data = null;
  let meta = null;
  try {
    data = fs.readFileSync(slide.image);
    meta = imageMeta(data);
  } catch {
    data = null;
  }
  if (data) {
    const ratio = meta.width > 0 && meta.height > 0 ? meta.width / meta.height : 16 / 9;
    let w = maxW;
    let h = w / ratio;
    if (h > bandH) {
      h = bandH;
      w = h * ratio;
    }
    s.picture((SLIDE_W - w) / 2, bandTop + (bandH - h) / 2, w, h, { data, ext: meta.ext });
  } else {
    // Missing file → labelled placeholder instead of a silently broken deck.
    s.rect(0.6, bandTop, maxW, bandH, { fill: COLORS.soft });
    s.text(`missing image: ${safe(slide.image, "?")}`, 0.6, bandTop + bandH / 2 - 0.2, maxW, 0.4, {
      fontSize: 14,
      color: COLORS.muted,
      align: "c",
      valign: "middle",
      margin: 0,
    });
  }
};

const renderBody = (s, slide, page) => {
  surface(s, COLORS.light, false, page);
  s.text(safe(slide.heading, "Point"), 0.78, 1.25, 4.2, 4.6, {
    fontSize: 32,
    color: COLORS.ink,
    bold: true,
    margin: 0,
  });
  s.line(5.1, 1.3, 5.1, 6.0, { color: COLORS.soft, width: 0.75 });
  s.text(safe(slide.body, ""), 5.45, 1.3, 7.15, 4.85, {
    fontSize: bodyFont(slide.body),
    color: COLORS.ink,
    margin: 0,
  });
};

const renderBullets = (s, slide, page) => {
  surface(s, COLORS.light, false, page);
  s.text(safe(slide.heading, "What matters"), 0.78, 1.05, 11.5, 1.0, {
    fontSize: 32,
    color: COLORS.ink,
    bold: true,
    margin: 0,
  });
  const items = Array.isArray(slide.bullets) && slide.bullets.length > 0
    ? slide.bullets.slice(0, 8)
    : ["First point", "Second point"];
  const n = items.length;
  // Choose font + step so the list fills the body band without crowding.
  const fontSize = n > 6 ? 16 : n > 5 ? 18 : n > 3 ? 20 : 24;
  const step = n > 6 ? 0.62 : n > 5 ? 0.74 : n > 3 ? 0.82 : 0.95;
  const startY = 2.55;
  const dotSize = 0.085;
  const dotX = 0.85;
  const textX = 1.18;
  const textW = SLIDE_W - textX - 0.6;
  items.forEach((item, i) => {
    const y = startY + i * step;
    // Vertically center the dot on the first line of text.
    const lineH = (fontSize * 1.25) / 72;
    const dotCy = y + lineH * 0.48;
    s.ellipse(dotX - dotSize / 2, dotCy - dotSize / 2, dotSize, dotSize, {
      fill: COLORS.ink,
    });
    s.text(item, textX, y, textW, step - 0.05, {
      fontSize,
      color: COLORS.ink,
      valign: "top",
      lineSpacing: 1.3,
      margin: 0,
    });
  });
};

const renderCompare = (s, slide, page) => {
  surface(s, COLORS.light, false, page);
  s.text(safe(slide.heading, "Compare"), 0.78, 1.0, 11.5, 0.9, {
    fontSize: 30,
    color: COLORS.ink,
    bold: true,
    margin: 0,
  });
  const top = 2.45;
  const colH = 4.05;
  const mid = SLIDE_W / 2;
  s.line(mid, top + 0.1, mid, top + colH - 0.2, { color: COLORS.soft, width: 0.75 });
  const leftBody = safe(slide.leftBody, "");
  const rightBody = safe(slide.rightBody, "");
  const labelOpts = { fontSize: 12, color: COLORS.muted, bold: true, spacing: 80, margin: 0 };
  s.text(safe(slide.leftLabel, "Today").toUpperCase(), 0.78, top, 5.65, 0.42, labelOpts);
  s.text(leftBody, 0.78, top + 0.6, 5.55, colH - 0.7, {
    fontSize: bodyFont(leftBody),
    color: COLORS.ink,
    margin: 0,
  });
  s.text(safe(slide.rightLabel, "Tomorrow").toUpperCase(), mid + 0.32, top, 5.65, 0.42, labelOpts);
  s.text(rightBody, mid + 0.32, top + 0.6, 5.55, colH - 0.7, {
    fontSize: bodyFont(rightBody),
    color: COLORS.ink,
    margin: 0,
  });
};

const renderStat = (s, slide, page) => {
  surface(s, COLORS.dark, true, page);
  const value = safe(slide.value, "1");
  s.text(value, 0.6, 2.1, 12.1, 2.0, {
    fontSize: value.length > 14 ? 80 : value.length > 8 ? 110 : 140,
    color: COLORS.white,
    bold: true,
    align: "c",
    valign: "middle",
    margin: 0,
  });
  s.text(safe(slide.caption, ""), 1.8, 4.4, 9.8, 1.4, {
    fontSize: 20,
    color: COLORS.soft,
    align: "c",
    margin: 0,
  });
};

const renderQuote = (s, slide, page) => {
  surface(s, COLORS.dark, true, page);
  const q = safe(slide.quote, "Quote");
  s.text(`"${q}"`, 1.2, 1.8, 10.9, 3.4, {
    fontSize: q.length > 200 ? 24 : q.length > 120 ? 28 : 34,
    color: COLORS.white,
    italic: true,
    valign: "middle",
    margin: 0,
  });
  if (slide.attribution) {
    s.text(`— ${slide.attribution}`, 1.25, 5.25, 9.5, 0.5, {
      fontSize: 14,
      color: COLORS.soft,
      spacing: 40,
      margin: 0,
    });
  }
};

const renderClosing = (s, slide, page) => {
  surface(s, COLORS.dark, true, page);
  const title = safe(slide.title, "Let's talk.");
  // Title box must hold 2 lines at 54pt (~1.9") without clipping the
  // subtitle. Subtitle box must hold 2 lines at 22pt (~0.8").
  s.text(title, 0.78, 1.9, 11.6, 2.4, {
    fontSize: heroLeadFont(title),
    color: COLORS.white,
    bold: true,
    margin: 0,
  });
  if (slide.subtitle) {
    s.text(slide.subtitle, 0.8, 4.6, 11.4, 1.0, {
      fontSize: 22,
      color: COLORS.soft,
      margin: 0,
    });
  }
  s.text("hello@gustav.im", 0.8, 5.85, 11.4, 0.5, {
    fontSize: 16,
    color: COLORS.white,
    bold: true,
    spacing: 60,
    margin: 0,
  });
};

export const renderSlide = (payload, index, deck) => {
  const title = payload.title ?? payload.heading ?? payload.intro ?? payload.label ?? payload.value ?? deck.title;
  const s = new SlideBuilder(index + 1, title);
  const page = index + 1;
  switch (payload.kind) {
    case "cover":
      renderCover(s, payload);
      break;
    case "hero":
      renderHero(s, payload, page);
      break;
    case "section":
      renderSection(s, payload, page);
      break;
    case "divider":
      renderDivider(s, payload, page);
      break;
    case "bullets":
      renderBullets(s, payload, page);
      break;
    case "compare":
      renderCompare(s, payload, page);
      break;
    case "stat":
      renderStat(s, payload, page);
      break;
    case "quote":
      renderQuote(s, payload, page);
      break;
    case "image":
      renderImage(s, payload, page);
      break;
    case "closing":
      renderClosing(s, payload, page);
      break;
    default:
      renderBody(s, payload, page);
  }
  return { xml: Buffer.from(s.toXml(), "utf8").toString("utf8"), media: s.media };
};
