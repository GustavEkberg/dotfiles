// The service worker is torn down while idle, so recording state cannot live in
// a module variable. `chrome.storage.session` is memory-backed and survives that.

const KEY = 'recording'

export const readSession = async () => {
  const stored = await chrome.storage.session.get(KEY)
  return stored[KEY] || null
}

export const writeSession = async (session) => {
  await chrome.storage.session.set({ [KEY]: session })
}

export const clearSession = async () => {
  await chrome.storage.session.remove(KEY)
}
