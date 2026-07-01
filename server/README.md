# Server Settings

Host/server-specific config lives here. Keep this for settings that do not belong in the general workstation config, such as local model server commands, systemd units, and server-only OpenCode/Fish overrides.

## Layout

```text
server/
|-- commands/   # executable command wrappers, e.g. local-llama-server
|-- services/   # service manager units, e.g. local-llama-server.service
|-- opencode/   # server-specific OpenCode config fragments or notes
`-- fish/       # server-specific Fish config fragments
```

Manual deployment only. Copy or symlink files into the active host locations yourself.

Do not commit secrets, tokens, private hostnames, or machine-local credentials. Put those in ignored `server/local/` files or keep them outside the repo.
