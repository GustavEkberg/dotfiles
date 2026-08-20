import { MESSAGE, send, toBackground } from './shared/messages.js'

const toggle = document.querySelector('#toggle')
const status = document.querySelector('#status')
const elapsed = document.querySelector('#elapsed')
const dot = document.querySelector('#dot')

const IDLE_HINT = 'Saves a WebM/Opus file to your downloads.'
const SAVE_POLL_MS = 300
const SAVE_POLL_ATTEMPTS = 40

let startedAt = null
let ticker = null

const formatElapsed = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = String(Math.floor(total / 60)).padStart(2, '0')
  const seconds = String(total % 60).padStart(2, '0')

  return `${minutes}:${seconds}`
}

const renderElapsed = () => {
  elapsed.textContent = startedAt ? formatElapsed(Date.now() - startedAt) : '00:00'
}

const render = (recording, message) => {
  toggle.disabled = false
  toggle.textContent = recording ? 'Stop and save' : 'Start recording'
  toggle.classList.toggle('recording', recording)
  dot.classList.toggle('live', recording)
  status.textContent = message || (recording ? 'Recording this tab. Audio keeps playing.' : IDLE_HINT)

  renderElapsed()

  if (ticker) {
    clearInterval(ticker)
    ticker = null
  }

  if (recording) {
    ticker = setInterval(renderElapsed, 500)
  }
}

const refresh = async (message) => {
  const state = await send(toBackground(MESSAGE.status))

  startedAt = state.recording ? state.startedAt : null
  render(Boolean(state.recording), state.ok ? message : state.error)

  return Boolean(state.recording)
}

// Stopping is asynchronous: the service worker clears state only once the file
// has been written, so wait for that rather than claiming success early.
const awaitSave = async () => {
  for (let attempt = 0; attempt < SAVE_POLL_ATTEMPTS; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, SAVE_POLL_MS))

    if (!(await refresh('Saving to downloads…'))) {
      render(false, 'Saved to your downloads.')

      return
    }
  }
}

toggle.addEventListener('click', async () => {
  toggle.disabled = true

  const recording = Boolean(startedAt)
  const result = await send(toBackground(recording ? MESSAGE.stop : MESSAGE.start))

  if (!result.ok) {
    await refresh(result.error)

    return
  }

  if (recording) {
    render(true, 'Saving to downloads…')
    await awaitSave()

    return
  }

  await refresh()
})

refresh()
