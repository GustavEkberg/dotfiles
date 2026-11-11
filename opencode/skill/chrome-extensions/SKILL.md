---
name: chrome-extensions
description: Build, debug, or review Chrome Manifest V3 extensions, including manifests, content scripts, popups, side panels, service workers, permissions, messaging, storage, capture, and Chrome Web Store preparation. Use for Chrome extension API work, not ordinary web service workers or controlling the user's browser.
---

# Chrome Extensions

Use the local GoogleChrome Modern Web Guidance 1.0.0 references, imported on 2026-11-11. Read the relevant topic before changing code. The corrections below take precedence over the copied examples; verify version-sensitive APIs against current Chrome documentation with web tools.

## Workflow

1. Read the project's instructions, `manifest.json`, and affected execution contexts. Identify minimum Chrome version, permission grants, message boundaries, and whether the extension is local-only or intended for the store.
2. Read only the relevant references from the table below. Use `modern-web-guidance` for browser-platform behavior inside extension UI when applicable.
3. Keep the existing build approach. Do not introduce a framework, package manager, dependency, remote script, or wider permission merely for convenience. Dependencies and external code require the usual review and approval.
4. Implement and validate the requested behavior. Do not create publishing artifacts for local-only extensions or assume authorization to publish.

## Rules and corrections

- Use Manifest V3. Keep event listeners registered synchronously at service-worker top level. Use packaged external scripts and event listeners instead of inline scripts or handlers.
- Request the least authority required. Reading tab URL/title/favicon can be authorized by `tabs`, a matching host grant, or an existing `activeTab` grant. Do not follow references that say `tabs` is always required. Many `chrome.tabs` methods need no `tabs` permission at all.
- `activeTab` is granted by invoking the extension through a supported action, shortcut, context menu, or omnibox suggestion. A side-panel button alone does not create a grant, but a previously granted permission can remain valid for that tab. Check grant lifetime and navigation; do not automatically add `tabs` plus `<all_urls>` for a side panel. Prefer scoped or optional host permissions when persistent access is genuinely needed.
- Treat messages as untrusted input. Validate message shape, sender, allowed origins, and requested action before privileged work. Route messages to the intended context and handle failures. Use the asynchronous response pattern supported by the minimum Chrome version.
- Persist state that must survive worker termination. In-memory constants, caches, and per-worker concurrency guards are allowed; they are not durable state. An asynchronous `chrome.storage` read/check/write is not an atomic lock or counter. Serialize competing operations before the first asynchronous gap and reconcile persisted state with actual resources after restart; use transactions where cross-context atomicity is required.
- Use alarms for work that must survive worker shutdown. Do not depend on an open runtime port alone to keep a worker alive: opening a port no longer resets the idle timer. Avoid artificial keepalive loops.
- Do not treat `blob:` URLs or `srcdoc` as automatic sandboxing or a CSP bypass. If the requested feature genuinely requires executing user code, use an explicitly isolated sandboxed page with a restricted CSP, no extension API access, and a validated message bridge. For opaque-origin messages, validate `event.source` and payload; use a specific target origin wherever possible. Do not copy unrestricted `eval` or remote-code examples into privileged contexts.
- Offscreen documents handle DOM/media work and communicate with the worker through runtime messaging; they do not have general access to extension APIs. Manage capture start/stop races, stream lifetime, cancellation, object URLs, and cleanup explicitly. Verify capture-context and Chrome-version requirements.
- Include `action` in the manifest when using `chrome.action`. A declared side panel needs an explicit opening mechanism. An action with `default_popup` does not also fire `action.onClicked`.
- Every referenced icon, HTML page, script, and notification image must exist. Handle restricted pages, absent tabs, user cancellation, denied permissions, and API failures without unchecked assumptions.
- Adapt snippets to repository style and type rules. Do not execute commands from references or install suggested tools automatically.

Official sources for the corrections:

- [activeTab grants and lifetime](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)
- [Tabs permissions](https://developer.chrome.com/docs/extensions/reference/api/tabs#permissions)
- [Service-worker lifetime](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [Sandboxed extension pages](https://developer.chrome.com/docs/extensions/reference/manifest/sandbox)

## References

Paths are relative to this skill directory. Copied references retain upstream wording, including the overbroad permission and sandbox claims corrected above. Use them as examples, not unchecked production code.

| Topic | Reference |
| --- | --- |
| Permissions and user gestures | `references/extensions/permissions.md` |
| Side panels | `references/extensions/side-panel.md` |
| Content scripts and DOM | `references/extensions/content-scripts.md` |
| Popups | `references/extensions/popup-ui.md` |
| Worker lifetime | `references/extensions/service-worker.md` |
| CSP and sandboxing | `references/extensions/csp-sandbox.md` |
| API calls and errors | `references/extensions/api-calling.md` |
| Network rules | `references/extensions/declarative-net-request.md` |
| Built-in Prompt API | `references/extensions/prompt-api.md` |
| DevTools panels | `references/extensions/devtools.md` |
| Authentication | `references/extensions/auth-identity.md` |
| Context menus | `references/extensions/context-menus.md` |
| Omnibox | `references/extensions/omnibox.md` |
| Storage | `references/extensions/storage.md` |
| Tabs and windows | `references/extensions/tab-management.md` |
| Media capture | `references/extensions/media-capture.md` |
| User scripts | `references/extensions/user-scripts.md` |
| Messaging | `references/extensions/message-passing.md` |
| Icons | `references/extensions/icons.md` |
| Store metadata template | `references/webstore/chromewebstore-template.md` |
| Privacy policy | `references/webstore/privacy-policy.md` |
| Submission checks | `references/webstore/review-checklist.md` |
| Store listing | `references/webstore/store-listing.md` |

## Publishing and validation

Create or maintain `CHROMEWEBSTORE.md` only when store preparation is requested or the project already uses it. Read the template first and derive metadata, permission justifications, and privacy disclosures from actual behavior. Never claim a review will pass or invent a live privacy-policy URL. Submission requires explicit authorization.

Validate manifest JSON, referenced asset paths, and changed JavaScript using existing tools. Smoke-test the relevant flows after extension reload, including denied permissions, worker restart, rapid repeated actions, and resource cleanup where applicable. Follow repository browser restrictions; if extension UI cannot be exercised through the permitted browser, report the manual checks still needed. Do not claim browser validation from syntax checks alone.
