export type Document = {
  readonly fields: Readonly<Record<string, string | boolean | ReadonlyArray<string>>>
  readonly body: string
}

const stripComment = (raw: string): string => {
  let quote = ''
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i]
    if (char === quote) quote = ''
    else if (!quote && (char === "'" || char === '"')) quote = char
    else if (char === '#' && !quote) return raw.slice(0, i).trimEnd()
  }
  return raw.trimEnd()
}

const unquote = (value: string): string => {
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replace(/''/g, "'")
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
  }
  return value
}

// The workspace contract uses only scalars and string arrays for searchable fields.
const splitArray = (value: string): ReadonlyArray<string> => {
  const items: string[] = []
  let current = ''
  let quote = ''
  for (const char of value.slice(1, -1)) {
    if (char === quote) quote = ''
    else if (!quote && (char === "'" || char === '"')) quote = char
    if (char === ',' && !quote) {
      items.push(unquote(current.trim()))
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) items.push(unquote(current.trim()))
  return items
}

export function parseDocument(source: string): Document {
  const text = source.replace(/^\uFEFF/, '')
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)
  if (!match) return { fields: {}, body: text }

  const lines = match[1].split(/\r?\n/)
  const fields: Record<string, string | boolean | ReadonlyArray<string>> = {}
  for (let i = 0; i < lines.length; i++) {
    const field = /^([A-Za-z_][\w]*):(?:\s+(.*))?$/.exec(stripComment(lines[i]))
    if (!field) continue
    const [, key, raw = ''] = field
    const value = raw.trim()
    if (value.startsWith('[') && value.endsWith(']')) {
      fields[key] = splitArray(value)
    } else if (value === 'true' || value === 'false') {
      fields[key] = value === 'true'
    } else if (!value && /^\s+-\s+/.test(lines[i + 1] ?? '')) {
      const items: string[] = []
      while (/^\s+-\s+/.test(lines[i + 1] ?? '')) {
        items.push(
          unquote(
            stripComment(lines[++i])
              .replace(/^\s+-\s+/, '')
              .trim(),
          ),
        )
      }
      fields[key] = items
    } else {
      fields[key] = unquote(value)
    }
  }
  return { fields, body: text.slice(match[0].length) }
}

export function stringField(doc: Document, key: string): string | null {
  const value = doc.fields[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function stringArrayField(doc: Document, key: string): ReadonlyArray<string> {
  const value = doc.fields[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export function archivedField(doc: Document): boolean {
  return doc.fields.archived === true
}

export function documentTitle(doc: Document, fallback: string): string {
  const heading = /^#\s+(.+)$/m.exec(doc.body)?.[1]?.trim()
  return stringField(doc, 'title') ?? heading ?? fallback.replace(/[-_]+/g, ' ')
}
