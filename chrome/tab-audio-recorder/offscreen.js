import { MESSAGE, TARGET, isFor, send, toBackground } from './shared/messages.js'

// Chrome's MediaRecorder cannot emit MP3; WebM/Opus is the only lossy audio
// container it encodes natively. Convert afterwards if MP3 is required.
const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm']
const TIMESLICE_MS = 1000

// Kept at module scope because the recorder outlives the message that started it.
let recorder = null
let audioContext = null
let capturedStream = null
let chunks = []
let filename = ''

const describe = (error) => (error instanceof Error ? error.message : String(error))

const pickMimeType = () => MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || ''

const releaseCapture = async () => {
  if (capturedStream) {
    capturedStream.getTracks().forEach((track) => track.stop())
    capturedStream = null
  }

  if (audioContext) {
    await audioContext.close().catch(() => {})
    audioContext = null
  }

  recorder = null
}

const fail = async (error) => {
  await releaseCapture()
  chunks = []
  await send(toBackground(MESSAGE.failed, { error: describe(error) }))
}

const finish = async () => {
  const mimeType = (recorder && recorder.mimeType) || MIME_CANDIDATES[MIME_CANDIDATES.length - 1]
  const blob = new Blob(chunks, { type: mimeType })

  chunks = []
  await releaseCapture()

  if (blob.size === 0) {
    await send(toBackground(MESSAGE.failed, { error: 'Recording was empty.' }))

    return
  }

  // Revoked implicitly when the service worker closes this document after the
  // download settles; the URL must stay valid until then.
  const url = URL.createObjectURL(blob)

  await send(toBackground(MESSAGE.finished, { url, filename }))
}

const start = async (streamId, targetFilename) => {
  if (recorder) {
    return { ok: false, error: 'Already recording.' }
  }

  try {
    capturedStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      }
    })
  } catch (error) {
    await releaseCapture()

    return { ok: false, error: describe(error) }
  }

  // Capturing a tab silences it for the user; routing the stream back to the
  // default output restores playback while recording.
  audioContext = new AudioContext()
  audioContext.createMediaStreamSource(capturedStream).connect(audioContext.destination)

  const mimeType = pickMimeType()

  if (!mimeType) {
    await releaseCapture()

    return { ok: false, error: 'No supported audio recording format.' }
  }

  chunks = []
  filename = targetFilename
  recorder = new MediaRecorder(capturedStream, { mimeType })

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data)
    }
  }

  recorder.onstop = () => {
    finish()
  }

  recorder.onerror = (event) => {
    fail((event && event.error) || 'MediaRecorder error.')
  }

  // A timeslice flushes chunks as they are produced, so a long recording is not
  // held as one growing buffer.
  recorder.start(TIMESLICE_MS)

  return { ok: true }
}

const stop = async () => {
  if (!recorder) {
    return { ok: false, error: 'Not recording.' }
  }

  recorder.stop()

  return { ok: true }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!isFor(TARGET.offscreen, message)) {
    return false
  }

  if (message.type === MESSAGE.start) {
    start(message.streamId, message.filename).then(sendResponse)

    return true
  }

  if (message.type === MESSAGE.stop) {
    stop().then(sendResponse)

    return true
  }

  return false
})
