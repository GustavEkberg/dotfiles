---
name: allabolag
description: Look up Swedish company info on allabolag.se when missing. Use when agent encounters a Swedish company name or organisationsnummer (org-nr) and needs to enrich with org number, registered address, contact, basic financials, SNI/industry code, or status (active/dissolved/F-skatt). Triggers on missing data for Swedish AB/HB/KB/EF entities.
---

# allabolag

Enrich missing Swedish company data via allabolag.se. Free public source covering all entities registered with Bolagsverket.

## When to Trigger

Auto-activate when ANY of these is missing for a Swedish company:

- Organisationsnummer (orgnr — `NNNNNN-NNNN`)
- Registered address / postal address
- Phone, email, website
- SNI code / industry classification
- Status (Aktivt, Avregistrerat, F-skatt, Moms)
- Latest revenue / employees (free tier shows current year + 1-2 prior)

Do NOT trigger for: non-Swedish companies, sole proprietors searching by personal name (integrity), or full multi-year financial history (paywalled — see "Limitations").

## Required Tooling

Load `crawl4ai` skill first. allabolag.se is JS-rendered + Cloudflare-protected — plain `WebFetch` fails. Use `crwl` (Playwright-backed).

```bash
which crwl || pip install -U crawl4ai && crawl4ai-setup
```

## URL Patterns

| Input | URL |
|-------|-----|
| Orgnr `556677-1234` | `https://www.allabolag.se/5566771234` |
| Company name | `https://www.allabolag.se/what/<url-encoded-name>` (search results page) |
| Direct slug | `https://www.allabolag.se/<orgnr>/<slug>` (canonical) |

Orgnr in URL is stripped of dash (10 digits). Slug variant is canonical and shown as link from search results.

## Workflow

### Step 1: Normalize Input

```
input = user-provided string
if matches /^\d{6}-?\d{4}$/        → orgnr (strip dash)
else                                → company name → search first
```

### Step 2: Resolve to Canonical Page

**By orgnr (preferred — unambiguous):**

```bash
crwl "https://www.allabolag.se/<orgnr>" -o markdown-fit --bypass-cache
```

**By name (ambiguous — verify match):**

```bash
crwl "https://www.allabolag.se/what/<encoded-name>" -o markdown-fit
```

Parse top result. If multiple matches with same/similar names → STOP and ask user which orgnr.

### Step 3: Extract Fields

Parse the fit-markdown for:

| Field | Pattern hints |
|-------|---------------|
| `orgnr` | `\d{6}-\d{4}` near top of page |
| `name` | H1 / page title |
| `status` | "Aktivt bolag", "Avregistrerat", "F-skatt: Ja/Nej", "Moms: Ja/Nej" |
| `address` | "Besöksadress" / "Postadress" blocks |
| `phone` / `email` / `website` | Contact section |
| `sni` | "Bransch" / "SNI-kod" — 5-digit code + label |
| `revenue` | "Omsättning" — latest year (kSEK) |
| `employees` | "Antal anställda" |
| `registered` | "Registreringsdatum" |
| `legal_form` | "Bolagsform" — AB / HB / KB / EF / Stiftelse |

If a field cannot be found, mark it `null` — **never invent values**.

### Step 4: Verification Gate

Before returning, confirm:

1. Extracted orgnr matches input orgnr (if user provided one)
2. Extracted name plausibly matches input name (case/accent-insensitive substring or fuzzy)
3. At least one of `address`, `sni`, `status` was extracted (else likely Cloudflare block — retry once with `-c "page_timeout=60000,wait_until=networkidle"`)

If verification fails → report failure, do not guess.

### Step 5: Return Inline Summary

Markdown block:

```
=== allabolag lookup ===

Name:        <name>
Orgnr:       <NNNNNN-NNNN>
Legal form:  <AB/HB/...>
Status:      <active/dissolved> · F-skatt: <yes/no> · Moms: <yes/no>
SNI:         <code> — <label>

Address:     <street>, <postcode> <city>
Phone:       <or null>
Email:       <or null>
Website:     <or null>

Revenue:     <kSEK> (<year>)
Employees:   <n>
Registered:  <YYYY-MM-DD>

Source:      https://www.allabolag.se/<orgnr>
Fetched:     <ISO timestamp>
```

Fields not found → omit or show `—`. Never fabricate.

## Limitations (declare to user when relevant)

- Free tier shows ~1-3 most recent fiscal years; full 10y history is paywalled (proff.se / bolagsverket.se for deeper)
- Board members / signatories require login — out of scope
- Real-time updates lag Bolagsverket by days
- Cloudflare may rate-limit aggressive lookups — single calls only, no deep crawl
- Sole proprietors (Enskild firma) have personal data implications — do not crawl without explicit user instruction

## Anti-Patterns

- Don't `--deep-crawl` allabolag — single-page lookups only, will trigger rate limits
- Don't use `WebFetch` — Cloudflare blocks non-browser UAs
- Don't return data without verifying orgnr-to-input match
- Don't merge data from multiple companies if name search returned ambiguous results — ask user
- Don't cache stale results across long-running sessions when status/financials matter — use `--bypass-cache`

## Fallback Sources

If allabolag blocks or lacks the field:

1. `https://www.proff.se/foretag/<orgnr>` — same data, sometimes more financial detail free
2. `https://snr.bolagsverket.se/` — official registry, authoritative but bare-bones
3. `https://www.ratsit.se/<orgnr>` — useful for board/officer info
