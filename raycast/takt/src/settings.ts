import { getPreferenceValues } from '@raycast/api'
import path from 'node:path'

export type Settings = {
  readonly workspaceRoot: string
  readonly siteOrigin: string
  readonly chromeProfile: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export function readSettings(): Settings {
  const values: unknown = getPreferenceValues()
  if (!isRecord(values)) throw new Error('Set the extension preferences before searching.')

  const { workspaceRoot, siteOrigin, chromeProfile } = values
  if (typeof workspaceRoot !== 'string' || !path.isAbsolute(workspaceRoot)) {
    throw new Error('Select an absolute Workspace Directory in extension preferences.')
  }
  if (typeof siteOrigin !== 'string') throw new Error('Set the Site Origin in extension preferences.')

  let url: URL
  try {
    url = new URL(siteOrigin)
  } catch {
    throw new Error('Site Origin must be a valid web address.')
  }
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.pathname !== '/' ||
    url.search ||
    url.hash ||
    url.username ||
    url.password
  ) {
    throw new Error('Site Origin must contain only the scheme and host, without a path or credentials.')
  }

  if (
    typeof chromeProfile !== 'string' ||
    !/^[\p{L}\p{N}][\p{L}\p{N} ._-]*$/u.test(chromeProfile.trim()) ||
    chromeProfile.includes('..')
  ) {
    throw new Error('Set a Chrome Profile Directory name in extension preferences.')
  }

  return {
    workspaceRoot,
    siteOrigin: url.origin,
    chromeProfile: chromeProfile.trim(),
  }
}
