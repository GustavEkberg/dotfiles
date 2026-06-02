---
id: digital-product-development-manifesto
title: Digital product development manifesto
kind: procedure
updatedAt: 2026-05-25
tags: [product, engineering, manifesto]
---

What I believe about building digital products. The lens I apply to my own work, and the one I push back on others' with. Building less is usually better than building more. Knowing what's worth building is still the hardest problem in this work, and shipping faster doesn't make that problem smaller. It makes it bigger.

Seven chapters. Each holds a handful of principles, each principle a single position. AI shows up in the last chapter because that's what it is: another part of product development, under harder discipline because the bottleneck moved.

## 1. You're racing a clock

Three months of beautiful work that arrives a week after the round closed buys nothing. Two months of messy work that arrives in time buys the next two years. Time is the constraint that prices every other decision in this document.

### Velocity is the clock you're trying to beat

Every startup is a race between learning and running out of money. The thing being built starts wrong and gets fixed in flight; the team that fixes it first wins. Velocity is the rate at which you compound toward whatever decides the next round, the next sale, or the next paycheck — hypotheses tested, features that landed, deals closed, infra that didn't break. Speed without progress on the thing that pays is motion, not velocity. Speed without reversibility breaks under its own weight by quarter two.

**The bar moved when building got cheap.** AI didn't kill the need for discipline. It killed the alibi that discipline had to slow you down. A competitor running three iterations to your one reaches the milestone before you do, and the math doesn't care that your iterations were prettier.

Pick the milestone that decides the next round, sale, or quarter of runway. Walk back from it. Cut every system, process, and decision that doesn't compound toward it. Invest in the rollback before the feature — reversibility is what lets you compound without compounding mistakes. Match every speed-up in delivery with a tightening of the gate before delivery. Measure cycle time at every layer: hypothesis-to-test, code-to-deploy, lead-to-close. If those numbers don't shrink quarter over quarter, you won't hit the curve.

## 2. The hardest problem is knowing what to build

Most failed products solved a real problem. Almost none of them solved one anyone would pay to fix. That gap is where product development lives, and no amount of building closes it.

### Need first, then hypothesis, then anything else

Companies start by picking a tool or a tech and looking for a problem it fits. The sequence runs the other way. Find the work that's broken, slow, or missing. Form a hypothesis about why. Only then ask whether software is the right answer.

If you can't name the customer who would pay to remove the pain, the feature doesn't exist for a reason. Kill it. Restate the underlying pain. Start again. See [how-can-we-improve](../../work/blog/posts/how-can-we-improve.md).

### Sell it before you build it

A signed contract beats five "yes I'd use that" conversations. Until someone is willing to pay before the feature exists, the pain isn't real enough to justify building for.

**Problem-market-fit before product-market-fit.** Convert the next prospect into a paid manual delivery before scoping the product. Confusing "people like the idea" with "people will pay" is the most expensive mistake in this category. See [feature-fever-age-of-ai](../../work/blog/posts/feature-fever-age-of-ai.md).

### Start with the solution, not the product

A consultancy that delivers the outcome manually is the cheapest validation loop in existence. Get to know the customer. See whether they trust you to solve the problem. See whether you can actually solve it. See whether you can sell the solution. Once the pattern repeats across clients, the product writes itself from what you had to do, not what the original spec said.

Most companies stuck on a product-shaped vision are looking at a service-shaped problem. Even mid-product companies whose pipeline isn't closing should strip back to a delivery loop and rebuild the product from the work they actually had to do.

## 3. Restraint is the default

Building feels productive. Shipping looks like progress. Both are true. Neither tells you whether the thing you're building should exist. Default to less.

### Feature fever is the most comfortable way to lose

When sales is slow, building feels like the one thing you can control. Five conversations sound like signal in B2B. They almost never are. You ship the feature, sales doesn't move, you ship another. Three releases later the product is a scattered version of itself and nothing pulls weight on its own.

**If you can't sell the core, a new feature on top of it won't help.** Stop building. Go back to the core hypothesis. See [feature-fever-age-of-ai](../../work/blog/posts/feature-fever-age-of-ai.md).

### Scope creep kills the core

Every product starts with a hypothesis: there is a need for X, and the pain is big enough that people will pay. That hypothesis is the secret sauce. Everything else is decoration until the core is proven.

Pull every non-core feature out of the next release. See what the product looks like at its sharpest. Ship that. Add back only what survives the absence test.

### One tool, one job

A tool that does two jobs does both worse than two focused tools would. The rule applies to internal tools, products, and services equally. When something tries to do two things, split it. When you can't split it, kill the weaker side.

**Bloat is the failure mode of organisations that build but never delete.** Retire ruthlessly. See [dawn-of-the-internal-product-developer](../../work/blog/posts/dawn-of-the-internal-product-developer.md).

## 4. Validate small, measure honestly, iterate

If you can't tell whether a change worked, you didn't ship a change. You shipped a wager.

### Build too fast and you lose control before you have it

Build too much too fast and you lose control before you have it. Spec-driven monoliths fail the same way every time. Months of planning, weeks of execution, no opportunity to learn anything until the whole thing lands. Iterative beats spec-driven on every axis that matters except the comfort of the person writing the plan.

Break to the smallest hypothesis worth testing. Build that. Look at what happened. Decide what's next from data, not from the original plan.

### Your reaction to the last conversation is the most biased data in the room

After months or years building, a customer saying "this is good" lands like proof. A customer hitting a bug mid-demo lands like the product is broken. Both feelings are louder than the data underneath them, and both will move decisions in the wrong direction if you let them.

**Small sample sizes plus high emotional stakes is the worst possible setup for honest reading.** Early-stage product work needs sobriety the most and offers it the least. State the hypothesis before the test. Pick the metric before the result. Treat your own reaction as one data point among many — and the most biased one, because you built the thing.

### The smallest testable unit is smaller than you think

Most teams overestimate the minimum viable version by an order of magnitude. The right size is what one person can build in a week. Anything bigger is a guess in disguise.

When scoping, ask "what would I cut to ship this in seven days?" The answer is usually the version that should have been built first.

### Adoption that isn't measured isn't adoption

Teams declare wins on the basis of "people are using it" and never check whether usage produced an outcome. That's not adoption. That's a comfort blanket.

Pick the outcome the tool was supposed to move. Measure it before and after. Retire the tool if the curve doesn't bend. See [enjoy-the-subsidy-while-it-lasts](../../work/blog/posts/enjoy-the-subsidy-while-it-lasts.md) and [adopt-so-you-can-adapt](../../work/blog/posts/adopt-so-you-can-adapt.md).

### Retire what's been replaced

Tool count going up while nothing comes off the stack is bloat. It looks like adoption from inside and reads as theatre from outside.

**For every new system, name what it replaces and set the retirement date in the same conversation.** If nothing comes off, the new system is additive, which usually means it gets used twice and abandoned.

## 5. Architecture is restraint applied to code

The same discipline that keeps a product focused keeps a codebase honest. Surface area you can hold in your head is surface area you can change. Everything else accumulates risk you can't price.

### Small surface, type-safe, no abstraction without use

Type safety isn't a religion. It's the cheapest way to make a codebase changeable a year after the people who wrote it have left. Abstraction added before there are two real callers is decoration.

Collapse abstractions back to concrete code. Re-abstract only when a second caller proves the shape.

### Specialised modules over monoliths

A 2000-line file doing six things will lose to six 300-line files doing one thing each. The reason isn't aesthetic. You can validate, replace, or delete each smaller piece in isolation. You can't do any of those things to the monolith without disturbing every workflow that depends on it.

Split by responsibility before the next feature lands. Carry the cost once instead of paying interest forever.

### Build for the day any dependency goes away

Every external service is a price you don't control, a roadmap you can't see, and a failure mode you'll meet when you can least afford it. Build as if every dependency will be removed on a Tuesday morning with no notice.

I want a thin port around every external dependency, a copy of every input and output in my own store, and at least one workflow path that doesn't need the vendor at all. See [enjoy-the-subsidy-while-it-lasts](../../work/blog/posts/enjoy-the-subsidy-while-it-lasts.md).

### Preserve understanding — cognitive debt outlasts technical debt

A codebase nobody understands is broken even when every test passes. Bad code is fixable. Lost shared theory of what the system does and why is not, short of rebuilding it with the people who originally knew.

Design notes capture intent, not just behaviour. Reviews ask "what did we learn?" The outgoing person teaches the next one, not hands over the keys. See [ai-makes-you-faster-at-losing-understanding](../../work/blog/posts/ai-makes-you-faster-at-losing-understanding.md).

## 6. Adoption is part of the build

A working product the organisation can't absorb is the same failure as a broken one. Ship the build and the adoption together, or come back six months later to find the tool unused.

### Tech owns the infrastructure, the whole org feeds the guardrails

Coding standards, design principles, working agreements, brand voice, customer goals — all of it belongs in plain markdown that humans and agents can read. Tech maintains the system. Every department feeds it.

One shared, version-controlled context. Owned by tech, populated by everyone. See [unlocking-company-wide-creativity-with-ai](../../work/blog/posts/unlocking-company-wide-creativity-with-ai.md).

### Sandbox first, production never by accident

Non-tech experimentation needs a place to break things. A sandbox with mock data, real shape, no path to production credentials. Inside the sandbox, run free. Outside it, locked.

The sandbox is the default. Anything reaching production is a deliberate, reviewed step.

### Route the work, keep judgment with people

Most of what an organisation does is move information from where it lives to whoever decides on it next. Reports, dashboards, CRMs, status meetings. **The routing layer is where automation belongs. Decisions stay where context and accountability live.**

Automate the routing aggressively. Leave the call to the human on the surface. See [ai-in-the-middle-humans-on-the-surface](../../work/blog/posts/ai-in-the-middle-humans-on-the-surface.md) and [my-ai-in-the-middle](../../work/blog/posts/my-ai-in-the-middle.md).

### Internal Product Developer over off-the-shelf

Generic tools fit nobody well. Custom-built internal tools, built by someone who understands both the work and the standards, fit exactly. The role is rare today and won't stay that way as AI lowers the coding barrier.

When evaluating a SaaS purchase, ask "could we build this ourselves in a week against our existing standards?" If the answer is yes, the SaaS purchase is a tax. See [dawn-of-the-internal-product-developer](../../work/blog/posts/dawn-of-the-internal-product-developer.md).

## 7. AI is product development under harder discipline

AI didn't change the rules. It moved the bottleneck. Writing the thing used to be the limit. Now knowing what's worth writing is. Every principle above applies. The penalties for ignoring them are just bigger.

### The model is a friend that lies twenty percent of the time

A really smart friend who has read everything and tells great stories. Knows what you want to hear. Lies one time in five. The percentage gets better. The shape doesn't. You can't program around the liar. You can decide where the human sits relative to it.

Humans on the edge of every consequential decision. Test the architecture by asking what happens when the model is wrong. See [working-with-ai-is-hard](../../work/blog/posts/working-with-ai-is-hard.md).

### Buttons before chat

Chat is the easy answer and almost always the wrong first AI feature. A button has a defined input, a structured output, a measurable success state, and a scope you can hold in your head. Chat has none of those. If you can build it without a text field, build it without a text field.

List the specific things the AI should do. Build each as a button. Measure clicks and acceptance per button. Iterate per button. See [why-your-first-ai-feature-shouldnt-be-a-chat](../../work/blog/posts/why-your-first-ai-feature-shouldnt-be-a-chat.md).

### LLM output is unsafe until proven otherwise

Any output from a model is potentially wrong. Anything you connect a model to that has write access is a risk. Auto-execution on the user's behalf is a category of mistake you will regret in production.

Human validation step between AI output and any real-world action. Always. **The validation isn't UX friction. It's the load-bearing safety layer.**

### Build for the day the model goes away

Provider-agnostic prompt layer. Portable data in your own store. Default to the smallest model that works, escalate per call when it doesn't. Treat every AI feature as a contract that gets renegotiated when prices move or providers shut down.

A primary model, a backup, and a workflow that still does something useful with no model at all. See [enjoy-the-subsidy-while-it-lasts](../../work/blog/posts/enjoy-the-subsidy-while-it-lasts.md).

### Augment so the team learns; replace and the knowledge dies

AI that sits alongside people sharpens them. Knowledge accumulates in humans who use it. AI that replaces people moves the knowledge into a system you don't own and can't audit. When the system goes, the knowledge goes with it.

Every AI rollout should produce smarter humans, not faster output alone. Measure the team's understanding of the work as a leading indicator. If the team can't explain what the model is doing, the rollout has failed, regardless of the throughput numbers. See [adopt-so-you-can-adapt](../../work/blog/posts/adopt-so-you-can-adapt.md).

## Closing

The pattern across every chapter is the same. Build less. Measure honestly. Keep judgment with people who can be wrong on purpose. Most products fail because someone wanted the tool more than they wanted the outcome. The work is to stay on the outcome side of that line.
