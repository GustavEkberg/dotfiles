# AGENTS.md - Server Settings

Server-specific config sources. Manual deployment only; do not add install/symlink automation without explicit request.

## Layout

| Path | Purpose |
|------|---------|
| `commands/` | Server-only command wrappers, such as `local-llama-server` |
| `services/` | Service manager units, such as `local-llama-server.service` |
| `opencode/` | Legacy OpenCode plugin files; no separate root config |
| `fish/` | Server-only Fish config fragments |
| `local/` | Ignored private local files |

## Rules

- Do not commit secrets, tokens, private hostnames, or credentials.
- Keep service files explicit about expected paths, users, ports, and environment files.
- Prefer small config fragments over duplicating full top-level configs.
- Shared OpenCode settings and V2 plugins live in the repo's root `opencode/` directory. Do not recreate `server/opencode/opencode.jsonc`.
- Validate touched files directly where possible: `bash -n`, `fish -n`, or service manager lint/check commands.
