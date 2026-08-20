// Recordings land in a `tab-audio/` folder under the browser download directory,
// named after the captured tab so several recordings stay distinguishable.

const MAX_SLUG_LENGTH = 60

const slug = (title) => {
  const cleaned = (title || '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .toLowerCase()

  return cleaned || 'tab'
}

export const buildFilename = (title, startedAt, extension) => {
  const stamp = new Date(startedAt).toISOString().slice(0, 19).replace(/[:T]/g, '-')

  return `tab-audio/${slug(title)}-${stamp}.${extension}`
}
