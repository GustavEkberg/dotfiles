import { spawn } from 'node:child_process'
import type { Settings } from './settings'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

export const taktUrl = (href: string, siteOrigin: string): string => `${siteOrigin}${href}`

export async function openInChrome(href: string, settings: Settings): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const chrome = spawn(
      CHROME,
      [`--profile-directory=${settings.chromeProfile}`, taktUrl(href, settings.siteOrigin)],
      {
        detached: true,
        stdio: 'ignore',
      },
    )
    chrome.once('error', reject)
    chrome.once('spawn', () => {
      chrome.unref()
      resolve()
    })
  })
}
