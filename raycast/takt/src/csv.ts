// RFC 4180 fields (including commas, newlines and escaped quotes) used by takt's CSV projections.
export function parseCsv(source: string): ReadonlyArray<Readonly<Record<string, string>>> {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const text = source.replace(/^\uFEFF/, '')

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') quoted = false
      else field += char
    } else if (char === '"') quoted = true
    else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      if (char === '\r' && text[i + 1] === '\n') i++
    } else field += char
  }

  if (quoted) return []
  if (row.length || field) rows.push([...row, field])
  const [header, ...data] = rows
  if (!header) return []
  return data
    .filter((cells) => cells.length === header.length)
    .map((cells) => Object.fromEntries(header.map((key, index) => [key, cells[index]])))
}
