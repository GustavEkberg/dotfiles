# Provenance and manual updates

Maintainer documentation. This file is not part of the skill's runtime workflow.

## Source

- Distribution: https://github.com/GoogleChrome/modern-web-guidance
- Authoring source: https://github.com/GoogleChrome/modern-web-guidance-src
- Maintainer: GoogleChrome project and its contributors; canonical upstream, not a third-party fork.
- Release: 1.0.0, 2026-11-10.
- Distribution commit: `4dd968349e54ca45a05dd5c818fb035c9054b022`.
- Reviewed/imported: 2026-11-11.
- Upstream entrypoint: https://raw.githubusercontent.com/GoogleChrome/modern-web-guidance/4dd968349e54ca45a05dd5c818fb035c9054b022/skills/modern-web-guidance/SKILL.md
- Upstream entrypoint SHA-256: `37d68a514c25066840299356e5857b750bec3cc27c0cf57dbe88369b051b573e`.

`references/guides/` contains 209 byte-for-byte upstream Markdown documents, relocated from `skills/modern-web-guidance/guides/`. `catalog.md` is a locally generated index of their titles, IDs, and opening paragraphs. `upstream-files.json` records an immutable raw source URL and SHA-256 for each imported file, including `LICENSE`. The original entrypoint hash is recorded separately because our `SKILL.md` is adapted.

No upstream CLI, installer, model, executable, plugin metadata, package dependency, or telemetry implementation is included. Documentation can still contain incorrect advice or commands: the local entrypoint restricts their use. External compatibility lookups use the harness's normal web permissions; no upstream program receives local files, environment variables, or credentials.

## Attribution and licenses

Adapted from Modern Web Guidance by GoogleChrome and contributors. The project is stewarded by the Google Chrome, Microsoft Edge, Mozilla Firefox, and MDN teams with the web development community. No endorsement of these local adaptations is implied.

The [pinned upstream README](https://github.com/GoogleChrome/modern-web-guidance/blob/4dd968349e54ca45a05dd5c818fb035c9054b022/README.md#--license) distinguishes software under Apache-2.0 from guide content under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/). `LICENSE` is the unmodified upstream Apache-2.0 license. Preserve the upstream notices and CC attribution when redistributing guides or derived documentation. Portions of the guides derive from [MDN Web Docs by Mozilla Contributors](https://developer.mozilla.org/), [W3C](https://www.w3.org/), [WHATWG](https://whatwg.org/), and [IETF](https://www.ietf.org/) specifications.

The reference documents are unchanged. Local changes replace the entrypoint's CLI workflow with file search, narrow triggering, require fresh compatibility verification, preserve project types/components, and remove automatic installation, telemetry, unsafe casts, and mandatory response attribution. `catalog.md` is derived from the guides. This file and the manifest are local maintenance records.

## Preserve during updates

- Keep runtime instructions in `SKILL.md`; keep provenance and update procedures here.
- Retain local-only discovery and selective reference reads. No `@latest`, package runner, hidden installer, auto-update, or automatic CLI feature gates.
- Keep existing framework components, browser targets, strict type rules, dependency approval, and experimental-feature consent requirements.
- Keep compatibility verification independent of snapshot age. A quarterly update does not establish current browser support.
- Do not restore mandatory output boilerplate or make upstream text override repository instructions.
- Review `../chrome-extensions/UPSTREAM.md` before changing that pack; it has additional corrections.

## Manual update procedure

Review every few months, or when a task exposes stale guidance. This is a reminder for a human-requested update, not a scheduled action.

1. Read this file, both packs' manifests, and the local Git diff. Preserve unrelated or user-authored changes.
2. Inspect upstream release notes and compare changes since the recorded commit using web tools. Resolve the proposed release to a full immutable commit. Review licenses, ownership, new instruction surfaces, and any proposed runtime dependencies.
3. Report the exact revision, material guidance changes, and risks; get explicit approval before downloading replacement files into the repository. Documentation-only updates must remain documentation-only unless separately approved.
4. Download the approved revision into a temporary directory. Never execute its files, run its installer, or extract a whole archive over this repository. Inspect paths and reject links, traversal, executable content, nested `SKILL.md`, or `AGENTS.md`.
5. Compare the complete old and new guide inventories, not only existing manifest entries. Import only Markdown from `skills/modern-web-guidance/guides/` and the upstream `LICENSE`; copy their bytes unchanged to the existing local paths. Review removals before deleting an obsolete local file. Compare the upstream entrypoint separately and selectively adapt our entrypoint rather than replacing it.
6. Rebuild `catalog.md`: one row per guide, sorted by relative path, with its first H1 as title, filename stem as ID, and first prose paragraph as summary. Strip fenced code, skip headings, lists, tables, HTML, and package-runner cross-references; collapse whitespace, truncate to 180 characters at a word boundary, HTML-escape text, and escape pipes. Update its commit header. Keep all links relative and pointed at the local files. The `language-model` and `prompt-api` guides currently duplicate content under separate upstream IDs; preserve both unless upstream removes one.
7. Regenerate `upstream-files.json` from the actual imported bytes. Preserve its schema; update revision, release, review date, each immutable source URL, each SHA-256, and the upstream entrypoint's source/hash. Hash the original upstream entrypoint, not our adaptation. Update this file's dates, attribution, inventory, and deliberate differences. Do the same for the extension pack only if it is being updated.
8. Check hashes and catalog paths with the snippet below. Review the final diff for new commands, dependencies, broad permissions, stale compatibility claims, and lost local safeguards. Smoke-test catalog discovery for a dialog, a layout capability, and an unsupported/experimental API; read the selected guides and confirm the entrypoint requires safe integration. For extension changes also test reasoning about an existing `activeTab` grant and rapid repeated capture starts.
9. Confirm existing OpenCode/Claude skill source links still resolve to the repo; do not create a second active copy. If shared settings or agent definitions changed, run `bun claude/sync.ts` and `bun claude/sync.ts --check` from the repo root. Report what was checked and any browser checks not performed.

## Integrity check

Run from the dotfiles repository root. This verifies local bytes and inventory against the recorded manifests; it does not independently revalidate upstream authenticity or technical correctness.

```sh
python3 - <<'PY'
import hashlib
import json
from pathlib import Path
import re

root = Path('opencode/skill')
for name in ('modern-web-guidance', 'chrome-extensions'):
    base = root / name
    manifest = json.loads((base / 'upstream-files.json').read_text())
    paths = set()
    for entry in manifest['files']:
        path = base / entry['path']
        assert path.is_relative_to(base) and '..' not in path.parts, path
        assert entry['path'] not in paths, path
        paths.add(entry['path'])
        assert f"/{manifest['commit']}/" in entry['source'], entry['source']
        assert hashlib.sha256(path.read_bytes()).hexdigest() == entry['sha256'], path
    actual = {p.relative_to(base).as_posix() for p in (base / 'references').rglob('*.md')}
    assert paths == actual | {'LICENSE'}, (name, paths ^ (actual | {'LICENSE'}))
    print(name, len(actual), 'reference documents verified')

base = root / 'modern-web-guidance'
links = re.findall(r'\]\((references/guides/[^)]+\.md)\)', (base / 'catalog.md').read_text())
guides = {p.relative_to(base).as_posix() for p in (base / 'references/guides').rglob('*.md')}
assert len(links) == len(set(links)) and set(links) == guides
assert all((base / link).is_file() for link in links)
print('Catalog covers every local guide')
PY
```
