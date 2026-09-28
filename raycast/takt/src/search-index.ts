import { parseCsv } from './csv'
import { archivedField, documentTitle, parseDocument, stringArrayField, stringField } from './frontmatter'

export type SearchKind = 'person' | 'company' | 'project' | 'deal' | 'note' | 'playbook' | 'invoice'

export type SearchItem = {
  readonly kind: SearchKind
  readonly id: string
  readonly name: string
  readonly href: string
  readonly path: string
  readonly secondary: string | null
  readonly tags: ReadonlyArray<string>
  readonly archived: boolean
  readonly markdown: string
}

const RESERVED = new Set(['AGENTS.md', 'AGENTS-LOCAL.md', 'CLAUDE.md', 'README.md'])

const validSegment = (segment: string): boolean =>
  /^[\p{L}\p{N}][\p{L}\p{N}._-]*$/u.test(segment) && !segment.includes('..')

const route = (...segments: ReadonlyArray<string>): string => `/data/${segments.map(encodeURIComponent).join('/')}`

const preview = (name: string, body: string, secondary: string | null): string => {
  const content = body.trim()
  if (!content) return `# ${name}\n\n${secondary ?? 'No document preview available.'}`
  return content.startsWith('# ') ? content : `# ${name}\n\n${content}`
}

const tagsFromCsv = (value: string): ReadonlyArray<string> => value.split('|').filter(Boolean)

export function buildSearchIndex(files: ReadonlyMap<string, string>): ReadonlyArray<SearchItem> {
  const items: SearchItem[] = []
  const csvRows = (path: string) => parseCsv(files.get(path) ?? '')

  for (const person of csvRows('people/people.csv')) {
    const { id, name } = person
    if (!validSegment(id) || !name) continue
    const path = `people/${id}/index.md`
    const secondary = person.role || person.emails?.split('|')[0] || null
    items.push({
      kind: 'person',
      id,
      name,
      href: route('people', id),
      path,
      secondary,
      tags: tagsFromCsv(person.tags ?? ''),
      archived: person.archived === 'true',
      markdown: preview(name, parseDocument(files.get(path) ?? '').body, secondary),
    })
  }

  for (const company of csvRows('companies/companies.csv')) {
    const { id, name } = company
    if (!validSegment(id) || !name) continue
    const path = `companies/${id}/index.md`
    const secondary = company.domain || company.relationship || null
    items.push({
      kind: 'company',
      id,
      name,
      href: route('companies', id),
      path,
      secondary,
      tags: tagsFromCsv(company.tags ?? ''),
      archived: company.archived === 'true',
      markdown: preview(name, parseDocument(files.get(path) ?? '').body, secondary),
    })
  }

  const projects = new Map<string, { name: string; tags: ReadonlyArray<string>; archived: boolean }>()
  for (const [path, source] of files) {
    const match = /^projects\/([^/]+)\/index\.md$/.exec(path)
    if (!match || !validSegment(match[1])) continue
    const id = match[1]
    const document = parseDocument(source)
    const name = stringField(document, 'name') ?? id
    const tags = stringArrayField(document, 'tags')
    const archived = archivedField(document)
    const status = stringField(document, 'status')
    projects.set(id, { name, tags, archived })
    items.push({
      kind: 'project',
      id,
      name,
      href: route('projects', id),
      path,
      secondary: archived ? `${status ?? 'Project'} · archived` : status,
      tags,
      archived,
      markdown: preview(name, document.body, status),
    })
  }

  for (const deal of csvRows('deals/deals.csv')) {
    const { id, name } = deal
    if (!validSegment(id) || !name) continue
    const path = `deals/${id}/index.md`
    const secondary = [deal.stage, deal.value && `${deal.value} ${deal.currency}`].filter(Boolean).join(' · ') || null
    items.push({
      kind: 'deal',
      id,
      name,
      href: route('deals', id),
      path,
      secondary,
      tags: tagsFromCsv(deal.tags ?? ''),
      archived: deal.archived === 'true',
      markdown: preview(name, parseDocument(files.get(path) ?? '').body, secondary),
    })
  }

  for (const [path, source] of files) {
    if (!path.endsWith('.md') || RESERVED.has(path.split('/').pop() ?? '')) continue
    const segments = path.slice(0, -3).split('/')
    const document = parseDocument(source)

    if (segments[0] === 'notes' && segments.length > 1 && segments.slice(1).every(validSegment)) {
      const name = documentTitle(document, segments.at(-1) ?? 'Untitled')
      const secondary = stringField(document, 'capturedAt')?.slice(0, 10) ?? null
      items.push({
        kind: 'note',
        id: path,
        name,
        href: route(...segments),
        path,
        secondary,
        tags: stringArrayField(document, 'tags'),
        archived: archivedField(document),
        markdown: preview(name, document.body, secondary),
      })
    } else if (
      segments[0] === 'me' &&
      segments[1] === 'playbook' &&
      segments.length > 2 &&
      segments.slice(2).every(validSegment)
    ) {
      const name = documentTitle(document, segments.at(-1) ?? 'Untitled')
      const secondary = stringField(document, 'kind')
      items.push({
        kind: 'playbook',
        id: path,
        name,
        href: route(...segments),
        path,
        secondary,
        tags: stringArrayField(document, 'tags'),
        archived: archivedField(document),
        markdown: preview(name, document.body, secondary),
      })
    } else if (segments[0] === 'projects' && segments.length > 2 && segments.slice(1).every(validSegment)) {
      if (segments.length === 3 && segments[2] === 'index') continue
      const project = projects.get(segments[1])
      if (!project) continue
      const name = documentTitle(document, segments.at(-1) ?? 'Untitled')
      const secondary = `${project.name} · ${segments.slice(2).join('/')}.md`
      items.push({
        kind: 'note',
        id: path,
        name,
        href: route(...segments),
        path,
        secondary,
        tags: [...new Set([...project.tags, ...stringArrayField(document, 'tags')])],
        archived: project.archived || archivedField(document),
        markdown: preview(name, document.body, secondary),
      })
    }
  }

  for (const invoice of csvRows('accounting/invoices.csv')) {
    const id = invoice.invoiceNumber
    if (!validSegment(id)) continue
    const path =
      invoice.invoiceFile?.startsWith('accounting/invoices/') && invoice.invoiceFile.endsWith('.md')
        ? invoice.invoiceFile
        : `accounting/invoices/${id}.md`
    const secondary = `${invoice.clientName ?? ''} · ${invoice.state ?? ''}`.trim()
    items.push({
      kind: 'invoice',
      id,
      name: id,
      href: `/data/accounting?search=${encodeURIComponent(id)}`,
      path,
      secondary,
      tags: [invoice.series, invoice.clientName].filter((tag): tag is string => Boolean(tag)),
      archived: false,
      markdown: preview(id, parseDocument(files.get(path) ?? '').body, secondary),
    })
  }

  return items
}

const ALIASES: Readonly<Record<string, SearchKind>> = {
  person: 'person',
  people: 'person',
  company: 'company',
  companies: 'company',
  project: 'project',
  projects: 'project',
  deal: 'deal',
  deals: 'deal',
  note: 'note',
  notes: 'note',
  playbook: 'playbook',
  playbooks: 'playbook',
  i: 'invoice',
  invoice: 'invoice',
  invoices: 'invoice',
}

const KIND_WEIGHT: Readonly<Record<SearchKind, number>> = {
  person: 3,
  company: 3,
  project: 2,
  deal: 2,
  note: 1,
  playbook: 1,
  invoice: 2,
}

const isBoundary = (character: string): boolean => ' -_./,'.includes(character)

// The same subsequence scoring and kind tie-breaks as takt's command palette.
function fuzzyScore(query: string, text: string): number | null {
  if (!query) return 0
  const needle = query.toLowerCase()
  const haystack = text.toLowerCase()
  let index = 0
  let score = 0
  let lastMatch = -2
  for (let i = 0; i < haystack.length && index < needle.length; i++) {
    if (haystack[i] !== needle[index]) continue
    score += 1 + (i === 0 ? 6 : isBoundary(haystack[i - 1]) ? 4 : 0) + (i === lastMatch + 1 ? 3 : 0)
    lastMatch = i
    index++
  }
  return index === needle.length ? score - haystack.length * 0.02 : null
}

export function searchItems(items: ReadonlyArray<SearchItem>, input: string, limit = 30): ReadonlyArray<SearchItem> {
  const archivedMatch = /^a\s+(.*)$/i.exec(input.trimStart())
  const archived = archivedMatch !== null
  const query = (archivedMatch ? archivedMatch[1] : input).trim()
  if (!query && !archived) return []
  const [prefix, ...rest] = query.split(/\s+/)
  const kind = ALIASES[prefix?.toLowerCase() ?? '']
  const search = kind ? rest.join(' ') : query
  const results = items.filter((item) => item.archived === archived && (!kind || item.kind === kind))
  if (!search) return results.sort((a, b) => a.name.localeCompare(b.name)).slice(0, limit)

  return results
    .flatMap((item) => {
      const scores = [item.name, item.id, item.secondary, ...item.tags]
        .flatMap((value) => (value === null ? [] : [fuzzyScore(search, value)]))
        .filter((value): value is number => value !== null)
      if (!scores.length) return []
      return [{ item, score: Math.max(...scores) + (kind ? 0 : KIND_WEIGHT[item.kind]) }]
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result) => result.item)
}
