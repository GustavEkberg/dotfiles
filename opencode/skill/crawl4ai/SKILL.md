---
name: crawl4ai
description: Deep research websites with Crawl4AI - LLM-friendly web crawler/scraper. Use when needing to crawl documentation sites, extract structured data from multiple pages, scrape content into clean markdown for RAG/research, or perform deep multi-page exploration of a domain. Triggers on tasks involving "crawl4ai", "crwl", "deep crawl", "scrape website", "research site", or "extract docs".
---

# crawl4ai

LLM-friendly web crawler. Converts websites to clean markdown, extracts structured data, performs deep multi-page crawls with BFS/DFS/BestFirst strategies. Use for research, RAG ingestion, or doc extraction.

## When to Use

- Deep-crawl a docs site or blog into markdown (research a topic across many pages)
- Extract structured data (JSON via CSS selectors or LLM)
- Two-phase crawl: fast URL discovery (`prefetch`) → selective full extraction
- Question-answer over crawled content (`-q`)
- Single-page scrape into clean/fit markdown for LLM context

## Install

```bash
pip install -U crawl4ai
crawl4ai-setup      # installs Playwright browsers
crawl4ai-doctor     # verify
```

Manual Playwright fallback if `crawl4ai-setup` fails:
```bash
python -m playwright install --with-deps chromium
```

LLM features (`-q`, LLM extraction) prompt on first use for provider + API token, stored in `~/.crawl4ai/global.yml`.

## CLI: `crwl`

### Basic
```bash
crwl https://example.com                       # default output
crwl https://example.com -o markdown           # raw markdown
crwl https://example.com -o markdown-fit       # filtered/clean markdown (best for LLMs)
crwl https://example.com -o json               # structured (needs extraction)
crwl https://example.com -v --bypass-cache     # verbose, no cache
crwl --example                                 # built-in examples
```

### Deep Crawl
```bash
crwl https://docs.example.com --deep-crawl bfs --max-pages 50
crwl https://docs.example.com --deep-crawl dfs --max-pages 30
crwl https://docs.example.com --deep-crawl best-first --max-pages 25
```

Strategies:
- `bfs` — breadth-first; comprehensive coverage
- `dfs` — depth-first; deep branches
- `best-first` — score-prioritized; **recommended** when paired with scorer

### LLM Q&A over crawled content
```bash
crwl https://example.com -q "What are the main API endpoints?"
crwl https://docs.example.com --deep-crawl bfs --max-pages 20 -q "Summarize auth flows"
```

### Structured Extraction (CSS, no LLM)
```bash
crwl https://example.com -e extract_css.yml -s css_schema.json -o json
```

`extract_css.yml`:
```yaml
type: "json-css"
params:
  verbose: true
```

`css_schema.json`:
```json
{
  "name": "ArticleExtractor",
  "baseSelector": ".article",
  "fields": [
    { "name": "title", "selector": "h1", "type": "text" },
    { "name": "link", "selector": "a.read-more", "type": "attribute", "attribute": "href" }
  ]
}
```

### Structured Extraction (LLM)
`extract_llm.yml`:
```yaml
type: "llm"
provider: "openai/gpt-4o-mini"
instruction: "Extract all articles with titles and links"
api_token: "${OPENAI_API_KEY}"
params:
  temperature: 0.3
```

```bash
crwl https://example.com -e extract_llm.yml -s llm_schema.json -o json
```

### Config Files (`-B` browser, `-C` crawler, `-f` filter)
```yaml
# browser.yml
headless: true
viewport_width: 1280
user_agent_mode: random
ignore_https_errors: true
```

```yaml
# crawler.yml
cache_mode: bypass
wait_until: networkidle
page_timeout: 30000
scan_full_page: true        # for infinite scroll
remove_overlay_elements: true
magic: true                 # auto-handle common popups
```

```yaml
# filter_bm25.yml — content filter for fit-markdown
type: bm25
query: "topic of interest"
threshold: 1.0
```

```bash
crwl https://example.com -B browser.yml -C crawler.yml -f filter_bm25.yml -o markdown-fit
```

Or inline:
```bash
crwl https://example.com -b "headless=true,viewport_width=1280"
crwl https://example.com -c "scan_full_page=true,page_timeout=60000"
```

## Python API (when CLI insufficient)

### Single page → fit markdown
```python
import asyncio
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
from crawl4ai.content_filter_strategy import PruningContentFilter
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator

async def main():
    cfg = CrawlerRunConfig(
        cache_mode=CacheMode.ENABLED,
        markdown_generator=DefaultMarkdownGenerator(
            content_filter=PruningContentFilter(threshold=0.48, threshold_type="fixed")
        ),
    )
    async with AsyncWebCrawler() as crawler:
        r = await crawler.arun("https://docs.example.com", config=cfg)
        print(r.markdown.fit_markdown)

asyncio.run(main())
```

### Deep crawl with filters + scorer (BestFirst — recommended)
```python
import asyncio
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig
from crawl4ai.deep_crawling import BestFirstCrawlingStrategy
from crawl4ai.deep_crawling.filters import FilterChain, URLPatternFilter, DomainFilter, ContentTypeFilter
from crawl4ai.deep_crawling.scorers import KeywordRelevanceScorer

async def main():
    chain = FilterChain([
        DomainFilter(allowed_domains=["docs.example.com"]),
        URLPatternFilter(patterns=["*guide*", "*tutorial*", "*api*"]),
        ContentTypeFilter(allowed_types=["text/html"]),
    ])
    scorer = KeywordRelevanceScorer(
        keywords=["authentication", "api", "config"],
        weight=0.7,
    )
    cfg = CrawlerRunConfig(
        deep_crawl_strategy=BestFirstCrawlingStrategy(
            max_depth=2, include_external=False,
            filter_chain=chain, url_scorer=scorer, max_pages=25,
        ),
        stream=True,
    )
    async with AsyncWebCrawler() as crawler:
        async for result in await crawler.arun("https://docs.example.com", config=cfg):
            score = result.metadata.get("score", 0)
            print(f"{score:.2f} | {result.url}")
            # result.markdown.fit_markdown available

asyncio.run(main())
```

### Two-phase crawl (prefetch then selective)
```python
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig

async def two_phase(start):
    async with AsyncWebCrawler() as crawler:
        # Phase 1: fast URL discovery (5-10x faster, no markdown)
        discovery = await crawler.arun(start, config=CrawlerRunConfig(prefetch=True))
        urls = [l["href"] for l in discovery.links.get("internal", [])]
        targets = [u for u in urls if "/blog/" in u]
        # Phase 2: full processing on filtered subset
        results = []
        for url in targets:
            r = await crawler.arun(url, config=CrawlerRunConfig(word_count_threshold=100))
            if r.success:
                results.append(r)
        return results
```

## Output Formats

| Flag | Description |
|------|-------------|
| `all` | Full crawl result with metadata |
| `markdown` / `md` | Raw markdown |
| `markdown-fit` / `md-fit` | Filtered markdown (recommended for LLM context) |
| `json` | Structured extracted data (requires `-e`/`-s`) |

## Deep Crawl Strategies — When to Use

| Strategy | Use Case |
|----------|----------|
| `BFSDeepCrawlStrategy` | Comprehensive coverage of a site |
| `DFSDeepCrawlStrategy` | Deep exploration of specific branches |
| `BestFirstCrawlingStrategy` | Topic-focused; pair with `KeywordRelevanceScorer` |

Key params: `max_depth`, `max_pages`, `include_external`, `filter_chain`, `url_scorer`, `score_threshold`.

## Filters

- `URLPatternFilter` — wildcard URL patterns (`*blog*`)
- `DomainFilter` — `allowed_domains` / `blocked_domains`
- `ContentTypeFilter` — `text/html` etc.
- `ContentRelevanceFilter` — BM25 over head section vs query
- `SEOFilter` — meta/header quality scoring

## Anti-Patterns

- Don't set `max_depth > 3` without `max_pages` cap — exponential blow-up
- Don't skip filters on deep crawls — you'll burn time on irrelevant pages
- Don't use raw `markdown` for LLM context if `markdown-fit` available — noisier
- Don't use LLM extraction when CSS schema works — slower, costs tokens
- Don't omit `cache_mode=bypass` when iterating during development — stale results
- Don't crawl HTTPS sites without `preserve_https_for_internal_links=True` if downgrade risk

## Common Pitfalls

- `crawl4ai-setup` MUST run after install — otherwise Playwright browsers missing
- LLM Q&A first-run prompts interactively — non-interactive shells need pre-populated `~/.crawl4ai/global.yml`
- `BestFirstCrawlingStrategy` ignores `score_threshold` — uses ordering instead
- Streaming mode (`stream=True`) recommended for `BestFirst` to get top-scored results first
- For infinite-scroll pages set `scan_full_page: true` + tune `scroll_delay`

## Docker (Self-Hosted API)

```bash
docker pull unclecode/crawl4ai:latest
docker run -d -p 11235:11235 --name crawl4ai --shm-size=1g unclecode/crawl4ai:latest
# Dashboard: http://localhost:11235/dashboard
# Playground: http://localhost:11235/playground
# MCP endpoint available for AI tool integration
```

POST `http://localhost:11235/crawl` with `{"urls": [...], "priority": 10}`.

## References

- Official docs: <https://docs.crawl4ai.com/>
- CLI: <https://docs.crawl4ai.com/core/cli/>
- Deep crawling: <https://docs.crawl4ai.com/core/deep-crawling/>
- Repo: <https://github.com/unclecode/crawl4ai>
