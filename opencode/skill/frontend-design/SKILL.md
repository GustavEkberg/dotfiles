---
name: frontend-design
description: Create distinctive, intentional, production-grade frontend interfaces. Use when building or reshaping web components, pages, or applications, especially with React frameworks, Tailwind CSS v4, shadcn/ui, and Motion.
---

# Frontend Design

Create distinctive, production-grade interfaces that feel designed for this subject, not generated from a generic template. Act like the design lead at a small studio: make deliberate choices about palette, typography, structure, motion, and copy. Take one justified aesthetic risk, then keep the rest disciplined.

## When to Use

- Building UI with React frameworks (Next.js, Vite, Remix)
- Creating visually distinctive, memorable interfaces
- Implementing accessible components with shadcn/ui, Tailwind CSS v4, and Motion
- Creating visual designs, posters, brand materials

## Reference Documentation

### Tailwind CSS v4.1

- `./references/tailwind/v4-config.md` - Installation, @theme, CSS-first config
- `./references/tailwind/v4-features.md` - Container queries, gradients, masks, text shadows
- `./references/tailwind/utilities-layout.md` - Display, flex, grid, position
- `./references/tailwind/utilities-styling.md` - Spacing, typography, colors, borders
- `./references/tailwind/responsive.md` - Breakpoints, mobile-first, container queries

Search: `@theme`, `@container`, `OKLCH`, `mask-`, `text-shadow`

### shadcn/ui (CLI v3.6)

- `./references/shadcn/setup.md` - Installation, visual styles, component list
- `./references/shadcn/core-components.md` - Button, Card, Dialog, Select, Tabs, Toast
- `./references/shadcn/form-components.md` - Form, Field, Input Group, 2026 components
- `./references/shadcn/theming.md` - CSS variables, OKLCH, dark mode
- `./references/shadcn/accessibility.md` - ARIA, keyboard, screen reader

Search: `Field`, `InputGroup`, `Spinner`, `ButtonGroup`, `next-themes`

### Animation (Motion + Tailwind)

- `./references/animation/motion-core.md` - Core API, variants, gestures, layout animations
- `./references/animation/motion-advanced.md` - AnimatePresence, scroll, orchestration, TypeScript

**Stack**:
| Animation Type | Tool |
|----------------|------|
| Hover/transitions | Tailwind CSS (`transition-*`) |
| shadcn states | `tailwindcss-animate` (built-in) |
| Gestures/layout/exit | Motion (`motion/react`) |
| Complex SVG morphing | anime.js v4 (niche only) |

### Visual Design

- `./references/canvas/philosophy.md` - Design movements, core principles
- `./references/canvas/execution.md` - Multi-page systems, quality standards

For sophisticated compositions: posters, brand materials, design systems.

## Design Thinking

Before coding, commit to a subject-specific aesthetic direction:

- **Subject**: What concrete product, audience, and page job? If unspecified, choose and state one.
- **World**: What materials, instruments, artifacts, vocabulary, or constraints belong to this subject?
- **Tone**: Pick a precise direction: brutally minimal, maximalist chaos, retro-futuristic, organic, luxury, playful, editorial, brutalist, art deco, soft/pastel, industrial, or something more specific.
- **Differentiation**: What makes this memorable for this brief, not any brief?
- **Signature**: What single element will the page be remembered by?

Bold maximalism and refined minimalism both work. Key is intentionality.

Work in two passes. First, create a compact design plan:

- **Color**: 4-6 named colors with hex or OKLCH values.
- **Type**: display, body, and optional utility/data roles. Avoid default families unless the product demands neutrality.
- **Layout**: one-sentence concept plus quick ASCII wireframe when useful.
- **Structure**: labels, dividers, numbering, and section rhythm must encode real information, not decoration.
- **Motion**: one orchestrated moment or a small set of purposeful interactions. Prefer less motion if extra animation feels synthetic.
- **Signature**: one distinctive device tied to the subject's world.

Second, critique the plan before building:

- Would this same plan fit an unrelated SaaS, portfolio, or landing page? If yes, revise.
- Are colors, type, and layout derived from the subject, or just current defaults?
- Does the hero express a thesis, not just a headline plus stats?
- Is the risk concentrated in one place, with the rest quiet enough to support it?
- Does the design still work on mobile, keyboard, and reduced-motion settings?

Only then implement. Derive class names, tokens, copy, and interactions from the plan.

## Anti-Patterns (NEVER)

- Overused fonts: Inter, Roboto, Arial, system fonts, Space Grotesk
- Cliched colors: purple gradients on white
- Default AI looks: warm cream plus serif plus terracotta, near-black plus acid accent, broadsheet hairlines without subject reason
- Predictable layouts and component patterns
- Numbered markers unless order matters
- Decorative structure that does not explain the content
- Scattered animation with no narrative purpose
- Cookie-cutter design lacking character
- Generic AI-generated aesthetics

## Best Practices

1. **Accessibility First**: Radix primitives, focus states, semantic HTML
2. **Mobile-First**: Start mobile, layer responsive variants
3. **Design Tokens**: Use `@theme` for spacing, colors, typography
4. **Dark Mode**: Apply dark variants to all themed elements
5. **Performance**: Automatic CSS purging, avoid dynamic class names
6. **TypeScript**: Full type safety
7. **Expert Craftsmanship**: Every detail matters

## Core Stack Summary

**Tailwind v4.1**: CSS-first config via `@theme`. Single `@import "tailwindcss"`. OKLCH colors. Container queries built-in.
**shadcn/ui v3.6**: Copy-paste Radix components. Visual styles: Vega/Nova/Maia/Lyra/Mira. New: Field, InputGroup, Spinner, ButtonGroup.
**Motion**: `import { motion, AnimatePresence } from 'motion/react'`. Declarative React animations. Use `tailwindcss-animate` for shadcn states.

## Typography

Choose beautiful, unique fonts. Pair distinctive display with refined body. **Max 3 font weights** — e.g. regular (400), medium (500), bold (700). More dilutes hierarchy; fewer constrains expression.

Typography carries personality. Make type treatment part of the design, not a neutral transport layer. Choose weights, widths, tracking, and scale deliberately.

```css
@theme {
  --font-display: "Playfair Display", serif;
  --font-body: "Source Sans 3", sans-serif;
}
```

## Color

Use OKLCH for vivid colors. Dominant colors with sharp accents:

```css
@theme {
  --color-primary-500: oklch(0.55 0.22 264);
  --color-accent: oklch(0.75 0.18 45);
}
```

## Motion

**Primary**: Motion for React animations. **Fallback**: CSS `@starting-style` for simple enter/exit.

```tsx
import { motion, AnimatePresence } from 'motion/react';

// Basic animation
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />

// Exit animations
<AnimatePresence>
  {show && <motion.div exit={{ opacity: 0 }} />}
</AnimatePresence>

// Layout animations
<motion.div layout />

// Gestures
<motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} />
```

CSS fallback (no JS):
```css
dialog[open] {
  opacity: 1;
  @starting-style { opacity: 0; transform: scale(0.95); }
}
```

## Spatial Composition

Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.

## Backgrounds

Create atmosphere: gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, grain overlays.

## Interface Copy

Words are design material. Write from the user's side of the screen.

- Use plain verbs and sentence case.
- Name what users control, not how the system is implemented.
- Keep action language consistent: `Publish` should lead to `Published`, not `Submitted`.
- Make empty states directional: explain what to do next.
- Make errors specific: what happened and how to fix it.
- Avoid filler, hype, and clever labels that slow comprehension.

## Build Quality

- Responsive down to mobile.
- Visible keyboard focus.
- Reduced motion respected.
- Semantic HTML before visual wrappers.
- Check CSS specificity: avoid broad selectors that accidentally override component classes.
- After implementation, remove one decorative accessory unless every element earns its place.
