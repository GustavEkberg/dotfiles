import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { buildSearchIndex, type SearchItem } from './search-index'

const execFileAsync = promisify(execFile)
const GIT = '/usr/bin/git'
const MAX_BUFFER = 16 * 1024 * 1024
const CSV_PATHS = new Set([
  'people/people.csv',
  'companies/companies.csv',
  'deals/deals.csv',
  'accounting/invoices.csv',
])
const RESERVED = new Set(['AGENTS.md', 'AGENTS-LOCAL.md', 'README.md', 'CLAUDE.md'])

function indexable(pathname: string): boolean {
  if (CSV_PATHS.has(pathname)) return true
  if (!pathname.endsWith('.md') || RESERVED.has(pathname.split('/').pop() ?? '')) return false
  return (
    /^people\/[^/]+\/index\.md$/.test(pathname) ||
    /^companies\/[^/]+\/index\.md$/.test(pathname) ||
    /^deals\/[^/]+\/index\.md$/.test(pathname) ||
    /^projects\/[^/]+\/.+\.md$/.test(pathname) ||
    pathname.startsWith('notes/') ||
    pathname.startsWith('me/playbook/') ||
    pathname.startsWith('accounting/invoices/')
  )
}

async function git(root: string, ...args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(GIT, ['-C', root, ...args], {
    encoding: 'utf8',
    maxBuffer: MAX_BUFFER,
    timeout: 30_000,
  })
  return stdout
}

export async function readCommittedIndex(root: string, sha: string): Promise<ReadonlyArray<SearchItem>> {
  const tree = await git(
    root,
    'ls-tree',
    '-r',
    '-z',
    sha,
    '--',
    'people',
    'companies',
    'projects',
    'deals',
    'notes',
    'me/playbook',
    'accounting/invoices.csv',
    'accounting/invoices',
  )
  const blobs = tree.split('\0').flatMap((entry) => {
    const separator = entry.indexOf('\t')
    if (separator < 0) return []
    const pathname = entry.slice(separator + 1)
    if (!indexable(pathname)) return []
    const match = /^100(?:644|755) blob ([0-9a-f]{40})$/.exec(entry.slice(0, separator))
    return match ? [{ pathname, sha: match[1] }] : []
  })

  const files = new Map<string, string>()
  for (let i = 0; i < blobs.length; i += 12) {
    const batch = await Promise.all(
      blobs.slice(i, i + 12).map(async (blob) => ({
        pathname: blob.pathname,
        content: await git(root, 'cat-file', 'blob', blob.sha),
      })),
    )
    for (const { pathname, content } of batch) files.set(pathname, content)
  }
  return buildSearchIndex(files)
}

let cached:
  | {
      readonly root: string
      readonly sha: string
      readonly promise: Promise<ReadonlyArray<SearchItem>>
    }
  | undefined

export async function loadSearchIndex(root: string, force = false): Promise<ReadonlyArray<SearchItem>> {
  const sha = (await git(root, 'rev-parse', 'HEAD')).trim()
  if (!force && cached?.root === root && cached.sha === sha) return cached.promise
  const promise = readCommittedIndex(root, sha)
  cached = { root, sha, promise }
  try {
    return await promise
  } catch (error) {
    if (cached.promise === promise) cached = undefined
    throw error
  }
}
