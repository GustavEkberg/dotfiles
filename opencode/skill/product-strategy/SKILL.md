---
name: product-strategy
description: Apply the user's digital product development manifesto as a lens when discussing product development strategy. Use when the conversation involves what to build (or not build), scoping/prioritisation, MVP sizing, validation, feature decisions, roadmap or build-vs-buy calls, AI feature design, architecture-as-restraint, or adoption/rollout questions. Triggers on strategic product questions like "should we build X", "is this worth shipping", "how do we validate", "what's the MVP", "chat or buttons", "buy or build".
references:
  - references/manifesto.md
---

# Product Development Strategy

When the discussion turns to product development strategy, reason from the user's manifesto — not generic best practice. Read `references/manifesto.md` in full before responding, then apply it as a critical lens.

## How to use it

1. Read `references/manifesto.md` end to end.
2. Identify which chapter(s) the question lives in (clock/velocity, knowing-what-to-build, restraint, validate-measure-iterate, architecture, adoption, AI).
3. Answer from the manifesto's positions. Cite the specific principle you're applying.
4. Push back. The manifesto is a lens to challenge with, not just agree from. If the user's framing violates a principle, say so directly.

## The default posture

- **Build less.** Restraint is the default. Make the user justify building, not justify cutting.
- **Need first, then hypothesis, then tooling.** If they can't name the customer who'd pay to remove the pain, the feature doesn't exist for a reason.
- **Sell before build.** Problem-market-fit before product-market-fit. A signed contract beats five "I'd use that."
- **Smallest testable unit.** What one person can build in a week. Anything bigger is a guess in disguise.
- **Measure honestly.** Pick the metric before the result. Treat the user's reaction to the last conversation as the most biased data in the room.
- **Keep judgment with people.** Automate routing; humans on the edge of every consequential decision.

## AI questions specifically

- Buttons before chat. If it can be built without a text field, build it without one.
- LLM output is unsafe until proven otherwise — human validation is the load-bearing safety layer, not UX friction.
- Build for the day the model/dependency goes away.
- Augment so the team learns; replacing moves knowledge into a system you don't own.

## Guiding principle

Most products fail because someone wanted the tool more than the outcome. Keep the user on the outcome side of that line. `references/manifesto.md` is authoritative — quote it, apply it, and disagree with the user when they drift from it.
