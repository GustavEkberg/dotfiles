---
name: person-research
description: Research one person from public professional sources. Use when given a name, LinkedIn URL, personal site, or profile and asked for verified basic facts, recent work or writing, or employer updates that mention the person.
---

# Person Research

Build a current, source-backed packet about one person. Reuse existing research,
fetch only missing or stale facts, and return a stable structure that other
workflows can consume.

This is not general lead discovery, company research, lead scoring, or outreach
generation. Research the person's employer only for recent material that
explicitly names or quotes the person.

## Inputs

Accept any combination of:

- Full name
- LinkedIn or other public profile URL
- Current or previous employer, role, location, or personal domain
- Existing research packet or facts with source URLs and `checked_at` dates
- A date window for recent updates

Ask one concise disambiguation question if the input could identify multiple
people. Do not merge candidates.

## Workflow

### 1. Check Existing Context

Inspect facts supplied by the calling workflow or already present in the
conversation. If the user's local knowledge base is available, load the `qmd`
skill and search the `people`, `items`, `companies`, `deals`, and `work`
collections using the exact name plus known employer. Follow the `qmd` skill's
read-after-search and read-only rules.

Classify existing facts:

- Stable facts, such as prior roles or authored publications: reuse when they
  have a direct source and no newer source conflicts.
- Current facts, such as role, employer, city-level location, or contact route:
  reuse when checked within 30 days; otherwise refresh.
- Recent updates: search from the previous `checked_at` date. If absent, use the
  last 90 days, then expand to 12 months only when the first window is empty.

Treat facts without a source or check date as unverified. There is no hidden
cache. Never write research back to the user's local knowledge base.

### 2. Resolve Identity

Establish one canonical subject using at least two matching attributes, such as
employer, role, city/country, personal domain, profile URL, or publication
history. Record conflicts rather than choosing silently.

Search-result pages may reveal a canonical LinkedIn URL, but their snippets are
discovery hints, not verified evidence.

### 3. Search Public Sources

Use `websearch` when available. Otherwise use `webfetch` to retrieve search
result pages. Fetch selected source pages with `webfetch`; do not use browser
automation for external research.

Start narrow and vary queries only as needed:

```text
"<full name>" "<employer>"
"<full name>" (bio OR team OR speaker OR author)
"<full name>" (blog OR newsletter OR interview OR podcast OR talk)
"<full name>" site:linkedin.com/in
site:<personal-domain> "<full name>"
site:<employer-domain> "<full name>"
"<full name>" "<employer>" (announcement OR appointment OR event OR launch)
```

Prefer sources in this order:

1. Person's site, blog, newsletter, publication, or public code profile
2. Current employer's team page, newsroom, blog, events, or changelog
3. Conference, university, publisher, standards body, or project site
4. Direct interview, podcast page, or event recording
5. Reputable reporting and official registries
6. Directories, aggregators, and search snippets for discovery only

For basic facts, seek a primary source. For consequential or conflicting facts,
seek a second independent source.

### 4. Find Recent Updates

Look for dated, substantive material involving the person:

- Their blog posts, newsletters, articles, publications, talks, podcasts, or
  notable public project updates
- Role changes, appointments, awards, or public professional milestones
- Employer posts, press releases, events, launches, or interviews that
  explicitly name, quote, credit, or feature the person

Do not include general employer news that merely overlaps with the person's
role. Record the publication date separately from the retrieval date. Prefer up
to five high-signal updates over a long activity dump.

### 5. Verify and Label

- Cite every returned fact with a source ID.
- Distinguish `reused`, `refreshed`, and `new` facts.
- Use confidence `high`, `medium`, or `low` based on identity certainty, source
  quality, recency, and corroboration.
- Quote sparingly. Summarize without changing meaning.
- State `not found` when evidence is absent; never fill gaps by inference.
- Put unresolved contradictions in `Unknowns and Conflicts`.

## LinkedIn Boundary

LinkedIn says public profiles can appear in public search tools:
`https://www.linkedin.com/help/linkedin/answer/a518980/linkedin-public-profile-visibility?lang=en`.
Its User Agreement prohibits automated scraping or copying of profiles and
bypassing access controls:
`https://www.linkedin.com/legal/user-agreement#dos`.

Therefore:

- Do not automate, crawl, or directly fetch LinkedIn profile, company, or post
  pages.
- Do not log in, use cookies, call private APIs, bypass an auth wall, or evade a
  rate limit.
- A public LinkedIn URL may identify the subject. Verify profile claims through
  independent public sources.
- User-pasted profile text may be summarized, but mark it `user-provided` and
  verify current facts elsewhere.

## Privacy Limits

Collect only public professional information relevant to the request.

- Do not collect home addresses, private phone numbers, private email addresses,
  family details, or data-broker records.
- Do not infer sensitive traits, health, politics, religion, sexuality, or other
  protected characteristics.
- Include a contact route only when the person self-published it for professional
  use. Never guess an email pattern.
- Research one person per invocation. Do not bulk-profile people.

## Output Contract

When called by another workflow, return this packet inline and do not write a
file unless the caller explicitly requests one. Preserve the headings and table
columns so downstream workflows can consume them.

```markdown
## Person Research Packet

Subject: <canonical name>
Status: resolved | ambiguous | partial
Researched at: <ISO-8601 timestamp>
Recent window: <start date> to <end date>

### Snapshot
<two to four factual sentences with source IDs>

### Basic Facts
| Field | Value | State | Confidence | Evidence |
|---|---|---|---|---|
| Current role | ... | reused/refreshed/new | high/medium/low | [S1] |

### Recent Updates
| Published | Update | Person connection | Evidence |
|---|---|---|---|

### Employer Mentions
| Published | Employer update naming the person | Evidence |
|---|---|---|

### Public Professional Links
- <label>: <URL> [S1]

### Unknowns and Conflicts
- <missing or conflicting claim>

### Sources
- [S1] <title> - <URL> (published <date or unknown>; checked <ISO date>)
```

For a standalone request, write the same packet to
`/tmp/person-research-<name-slug>-<YYYY-MM-DD>.md` and return its path. Do not
create persistent personal-data files inside the current repository unless the
user explicitly requests that location.
