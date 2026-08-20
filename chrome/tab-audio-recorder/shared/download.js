// `chrome.downloads` is unavailable to offscreen documents, so saving always
// runs in the service worker. The promise settles only once the download has
// stopped moving, which is what keeps the source blob URL alive long enough.

const settled = (downloadId) =>
  new Promise((resolve) => {
    const onChanged = (delta) => {
      if (delta.id !== downloadId || !delta.state) {
        return
      }

      if (delta.state.current === 'complete' || delta.state.current === 'interrupted') {
        chrome.downloads.onChanged.removeListener(onChanged)
        resolve(delta.state.current)
      }
    }

    chrome.downloads.onChanged.addListener(onChanged)
  })

export const downloadUrl = async (url, filename) => {
  const downloadId = await chrome.downloads.download({ url, filename, saveAs: false })
  const state = await settled(downloadId)

  return { ok: state === 'complete', state }
}
