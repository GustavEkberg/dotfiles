# Provenance and manual updates

Maintainer documentation. This file is not part of the skill's runtime workflow.

## Source

- Distribution: https://github.com/GoogleChrome/modern-web-guidance
- Authoring source: https://github.com/GoogleChrome/modern-web-guidance-src
- Maintainer: GoogleChrome project and contributors; canonical upstream, not a third-party fork.
- Release: 1.0.0, 2026-11-10.
- Distribution commit: `4dd968349e54ca45a05dd5c818fb035c9054b022`.
- Reviewed/imported: 2026-11-11.
- Upstream entrypoint: https://raw.githubusercontent.com/GoogleChrome/modern-web-guidance/4dd968349e54ca45a05dd5c818fb035c9054b022/skills/chrome-extensions/SKILL.md
- Upstream entrypoint SHA-256: `c67d9e4ba9da93ed0da8b0147235e5890aa24e659548f65b7765c5af0a470c3f`.

`references/` contains 23 byte-for-byte upstream Markdown files from `skills/chrome-extensions/references/`. `upstream-files.json` records each imported file's immutable source URL and SHA-256, including the unmodified Apache-2.0 `LICENSE`. It also records the original entrypoint's source/hash; our entrypoint is adapted. No upstream executable, installer, plugin, or dependency is included.

## Attribution and local changes

Adapted from Modern Web Guidance by GoogleChrome and contributors. See the [pinned upstream licensing statement](https://github.com/GoogleChrome/modern-web-guidance/blob/4dd968349e54ca45a05dd5c818fb035c9054b022/README.md#--license): software is Apache-2.0; guide content under `guides/` is [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/). Extension references are distributed under the repository's Apache-2.0 default unless an individual notice says otherwise. Preserve all notices; do not assume copied or adapted snippets lose their licensing requirements. No upstream endorsement of local changes is implied.

The references are unchanged. The local entrypoint replaces the upstream rule list and adds scoped permission advice, checked messages, lifecycle/concurrency corrections, CSP isolation requirements, and task-scoped publishing. It does not mandate a package manager, framework, `.then()` prohibition, or store metadata for local-only extensions.

## Update procedure

Follow the approval, immutable-source, inventory, hashing, and validation procedure in [the sibling maintenance file](../modern-web-guidance/UPSTREAM.md#manual-update-procedure). For this pack, import only `skills/chrome-extensions/references/**/*.md` and `LICENSE`, preserve paths, and compare the upstream `SKILL.md` separately. The entrypoint's reference table must cover every imported topic. Update this pack's manifest and provenance even if the general web pack is unchanged. Do not edit the vendored references to hide upstream defects; maintain corrections in our entrypoint until upstream fixes are reviewed.

Check every few months or after an API/lifecycle change. No scheduler or automatic fetch is configured.

## Corrections to re-check, not discard blindly

1. `permissions.md`, `tab-management.md`, `media-capture.md`, and `side-panel.md` overstate when `tabs` or broad host permissions are required. Existing host/`activeTab` grants can authorize tab metadata; opening a side panel does not revoke a still-valid grant. Verify against [activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab) and [tabs permissions](https://developer.chrome.com/docs/extensions/reference/api/tabs#permissions).
2. `csp-sandbox.md` incorrectly claims `blob:` and `srcdoc` automatically provide a separate origin and bypass extension CSP. Keep explicit isolation, a restricted sandbox CSP, and message validation. See [Chrome sandbox pages](https://developer.chrome.com/docs/extensions/reference/manifest/sandbox) and [MDN iframe origin/sandbox behavior](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe).
3. `service-worker.md` incorrectly promises that opening a port keeps the worker alive. Chrome 114+ changed this; see [worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle). Persistent state is necessary, but not every global value needs storage.
4. `media-capture.md` and `service-worker.md` include asynchronous storage read/modify/write examples that are not atomic. A persisted `starting` state does not prevent two callbacks from reading `idle` before either write completes. Preserve serialized transitions and restart reconciliation; do not claim concurrency safety based on storage alone.
5. Other examples are not fully audited. Verify current API signatures, capture context/version requirements, permission gestures, message trust boundaries, and store policies for the actual task. Syntax-valid documentation is not proof of safe runtime behavior.

Manual reasoning checks after an update: access a URL under an existing `activeTab` grant without broadening permissions; open a side panel after navigation revokes the grant; handle two capture clicks before the first storage read resolves; restart the worker mid-operation; reject an untrusted message to a sandbox bridge; avoid creating store artifacts for a local-only extension.
