// Message envelopes shared by the popup, service worker and offscreen document.
// Every message carries a `target` so each context can ignore traffic that is
// not addressed to it; `chrome.runtime.sendMessage` broadcasts to all of them.

export const TARGET = {
  background: 'background',
  offscreen: 'offscreen'
}

export const MESSAGE = {
  start: 'start',
  stop: 'stop',
  status: 'status',
  finished: 'finished',
  failed: 'failed'
}

export const toBackground = (type, payload) => ({ target: TARGET.background, type, ...payload })

export const toOffscreen = (type, payload) => ({ target: TARGET.offscreen, type, ...payload })

export const isFor = (target, message) => Boolean(message) && message.target === target

// `sendMessage` rejects when no context is listening. Recording state must not
// depend on that race, so failures collapse into an explicit result. `unreachable`
// separates "nobody listening yet" from an error the receiver actually reported.
export const send = async (message) => {
  try {
    const response = await chrome.runtime.sendMessage(message)

    return response || { ok: false, error: 'No response.', unreachable: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      unreachable: true
    }
  }
}

// `chrome.offscreen.createDocument` resolves before the document's module script
// has registered its message listener, so the first sends can find no receiver.
export const sendWhenReady = async (message, attempts = 20, delayMs = 50) => {
  let result = { ok: false, error: 'No response.', unreachable: true }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    result = await send(message)

    if (!result.unreachable) {
      return result
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  return result
}
