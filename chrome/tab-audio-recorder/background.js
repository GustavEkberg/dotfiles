import { downloadUrl } from './shared/download.js'
import { buildFilename } from './shared/filename.js'
import { MESSAGE, TARGET, isFor, send, sendWhenReady, toOffscreen } from './shared/messages.js'
import { clearSession, readSession, writeSession } from './shared/session.js'

const OFFSCREEN_DOCUMENT = 'offscreen.html'
const UNCAPTURABLE = /^(chrome|edge|about|devtools|chrome-extension|chrome-untrusted):/

const describe = (error) => {
  if (error instanceof Error) {
    return error.message
  }

  return typeof error === 'string' ? error : 'Unknown error.'
}

const setBadge = (recording) => {
  chrome.action.setBadgeText({ text: recording ? 'REC' : '' })

  if (recording) {
    chrome.action.setBadgeBackgroundColor({ color: '#c0392b' })
  }
}

const hasOffscreenDocument = async () => {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })

  return contexts.length > 0
}

const openOffscreenDocument = async () => {
  if (await hasOffscreenDocument()) {
    return
  }

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT,
    reasons: ['USER_MEDIA'],
    justification: 'Capture and encode tab audio with MediaRecorder.'
  })
}

// Closing the document also revokes the blob URL it created, so only call this
// once any pending download has finished reading from it.
const closeOffscreenDocument = async () => {
  if (await hasOffscreenDocument()) {
    await chrome.offscreen.closeDocument()
  }
}

const teardown = async () => {
  await clearSession()
  setBadge(false)
  await closeOffscreenDocument()
}

const startRecording = async () => {
  if (await readSession()) {
    return { ok: false, error: 'Already recording.' }
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (!tab || typeof tab.id !== 'number') {
    return { ok: false, error: 'No active tab.' }
  }

  if (UNCAPTURABLE.test(tab.url || '')) {
    return { ok: false, error: 'Chrome does not allow capturing this page.' }
  }

  let streamId

  try {
    streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id })
  } catch (error) {
    return { ok: false, error: describe(error) }
  }

  const startedAt = Date.now()
  const filename = buildFilename(tab.title, startedAt, 'webm')

  await openOffscreenDocument()

  const started = await sendWhenReady(toOffscreen(MESSAGE.start, { streamId, filename }))

  if (!started.ok) {
    await teardown()

    return started
  }

  await writeSession({ tabId: tab.id, title: tab.title || '', startedAt })
  setBadge(true)

  return { ok: true }
}

const stopRecording = async () => {
  const session = await readSession()

  if (!session) {
    return { ok: false, error: 'Not recording.' }
  }

  const stopped = await send(toOffscreen(MESSAGE.stop))

  if (!stopped.ok) {
    await teardown()
  }

  return stopped
}

const reportStatus = async () => {
  const session = await readSession()

  return { ok: true, recording: Boolean(session), startedAt: session ? session.startedAt : null }
}

// The offscreen document cannot reach `chrome.downloads`, so it hands the blob
// URL over and the service worker saves it.
const saveRecording = async ({ url, filename }) => {
  try {
    const saved = await downloadUrl(url, filename)

    if (!saved.ok) {
      console.error('Tab Audio Recorder: download', saved.state)
    }
  } catch (error) {
    console.error('Tab Audio Recorder: download failed', describe(error))
  }

  await teardown()
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isFor(TARGET.background, message)) {
    return false
  }

  if (message.type === MESSAGE.start) {
    startRecording().then(sendResponse)

    return true
  }

  if (message.type === MESSAGE.stop) {
    stopRecording().then(sendResponse)

    return true
  }

  if (message.type === MESSAGE.status) {
    reportStatus().then(sendResponse)

    return true
  }

  if (message.type === MESSAGE.finished) {
    saveRecording(message).then(() => sendResponse({ ok: true }))

    return true
  }

  if (message.type === MESSAGE.failed) {
    console.error('Tab Audio Recorder:', message.error)
    teardown().then(() => sendResponse({ ok: true }))

    return true
  }

  return false
})

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const session = await readSession()

  if (session && session.tabId === tabId) {
    await stopRecording()
  }
})

// A reload or update leaves no offscreen document behind; drop any stale state.
chrome.runtime.onStartup.addListener(teardown)
chrome.runtime.onInstalled.addListener(teardown)
