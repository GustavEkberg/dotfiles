# Tab Audio Recorder

Buildless Chrome MV3 extension that records the audio of the active tab and saves it to your downloads.

## Install

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this folder: `chrome/tab-audio-recorder`.

## Use

1. Open the tab you want to record and start its audio.
2. Click the extension icon, then `Start recording`.
3. Click `Stop and save`. The file lands in `Downloads/tab-audio/`.

The badge shows `REC` while capturing. The tab stays audible: `tabCapture` mutes
the tab, so the stream is routed back to the default output.

## Format

Output is **WebM/Opus** (`.webm`), not MP3. Chrome's `MediaRecorder` cannot encode
MP3 — that would require vendoring a third-party JS encoder. Convert locally:

```sh
ffmpeg -i tab-audio/example.webm -codec:a libmp3lame -q:a 2 example.mp3
```

## Notes

- Records the tab that is active when you press start; switching tabs does not
  move the capture. Closing that tab stops and saves the recording.
- Chrome refuses to capture `chrome://` pages, the Web Store, and other
  extension pages.
- Recording survives the service worker idling out; state lives in
  `chrome.storage.session`.

## Permissions

| Permission | Why |
|------------|-----|
| `activeTab` | Read the active tab's id and title on invocation |
| `tabCapture` | Obtain the tab audio stream id |
| `offscreen` | `MediaRecorder` needs a DOM; service workers have none |
| `downloads` | Write the finished file (offscreen documents cannot) |
| `storage` | Keep recording state across service worker restarts |

## Layout

| File | Role |
|------|------|
| `background.js` | Service worker: capture handshake, state, saving |
| `offscreen.js` | Runs `getUserMedia` + `MediaRecorder`, builds the blob |
| `popup.js` | Start/stop control, elapsed timer, status |
| `shared/messages.js` | Message envelopes and targeted `sendMessage` |
| `shared/session.js` | Recording state in `chrome.storage.session` |
| `shared/download.js` | Download that settles when the file is written |
| `shared/filename.js` | `tab-audio/<tab-title>-<timestamp>.webm` |
