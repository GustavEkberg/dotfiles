---
description: Deep research a website using crawl4ai - crawl, extract, summarize
---

Deep-research a website with Crawl4AI. Crawl pages → fit-markdown → optional summary.

## Workflow

### Step 1: Load skill

```
skill({ name: 'crawl4ai' })
```

### Step 2: Parse user request

Extract from `<user-request>`:
- **URL** (required) — entry point
- **Topic / question** (optional) — for scorer keywords & final Q&A
- **Depth** (default `2`) and **max-pages** (default `25`)
- **Strategy** (default `best-first` if topic given, else `bfs`)
- **Output dir** (default `./crawl4ai-research/<domain>/`)

If URL missing → ask user.

### Step 3: Execute crawl

Pick path based on inputs:

**A. Topic-focused deep crawl (best-first + keyword scorer)** — when topic provided:

Write a Python script to `./crawl4ai-research/_crawl.py` using `BestFirstCrawlingStrategy` + `KeywordRelevanceScorer(keywords=<topic-tokens>)`, `stream=True`, fit-markdown output. Save each page as `<slug>.md` with score+depth header.

**B. Broad deep crawl** — when no topic:

```bash
crwl <URL> --deep-crawl bfs --max-pages <N> -o markdown-fit > ./crawl4ai-research/<domain>/dump.md
```

**C. Single-page** — when user asks one URL only:

```bash
crwl <URL> -o markdown-fit
```

### Step 4: Optional Q&A summary

If topic given, after crawl:

```bash
crwl <URL> -q "<user topic question>"
```

Or run a local synthesis pass over collected markdown files.

### Step 5: Report

```
=== crawl4ai Research Complete ===

URL:        <url>
Strategy:   <bfs|dfs|best-first>
Pages:      <count> / <max-pages>
Output:     ./crawl4ai-research/<domain>/

Top pages by score:
  1. <score> <url>
  2. <score> <url>
  ...

Topic:      <topic or "general crawl">
Summary:    <one-paragraph synthesis if topic given>
```

## Guardrails

- **Never** exceed `max_pages` cap user specified (or default 25)
- **Always** stay within entry domain unless user explicitly says otherwise (`include_external=False`)
- **Respect robots.txt** if user mentions production target
- Cache enabled by default; pass `--bypass-cache` only if user requests fresh data

<user-request>
$ARGUMENTS
</user-request>
