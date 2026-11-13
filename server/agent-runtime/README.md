# Agent runtimes

Pinned runtime configuration for the Linux `agent` account. Mise owns complete
installations under `/home/agent/.local/share/mise/installs`.

## Reviewed versions

These match the existing runtimes; version upgrades are a separate change.

| Tool | Version | Release date | Canonical source / maintainer | License |
| --- | --- | --- | --- | --- |
| Node.js | 24.18.0 | 2026-06-23 | [nodejs/node](https://github.com/nodejs/node), Node.js contributors / OpenJS | MIT plus bundled dependency licenses |
| Bun | 1.3.14 | 2026-05-13 | [oven-sh/bun](https://github.com/oven-sh/bun), Bun team | MIT plus bundled licenses, including LGPL |
| pnpm | 11.9.0 | 2026-06-23 | [pnpm/pnpm](https://github.com/pnpm/pnpm), Zoltan Kochan and contributors | MIT |
| OpenCode | 2.2.6 | 2026-11-06 | [anomalyco/opencode](https://github.com/anomalyco/opencode), Anomaly / thdxr | MIT |
| QMD | 2.5.3 | 2026-05-29 | [tobi/qmd](https://github.com/tobi/qmd), Tobi Lutke | MIT |

These are established upstream projects, not forks. Mise downloads the runtime
distributions and uses pnpm for the official `@opencode/cli` package. Its approved
postinstall selects the native executable; platform dependencies are also pinned
to 2.2.6. The latest OpenCode release at review was 2.3.0 (2026-11-13); this setup
retains the installed version during migration.

QMD uses the published `@tobilu/qmd@2.5.3` package, matching the existing index
reader. Its build allowlist follows that release's package manifest. Its SQLite,
llama.cpp, and grammar dependencies can download or compile native code during
installation. QMD reads the shared workspace index and documents; semantic
queries also need its model cache.

The lockfile records versions and build options for npm tools, and URLs and
checksums for runtime distributions. With the pnpm installer, npm tools' dependency
lockfiles live in their agent-owned installation directories; `mise.lock` does
not freeze their full transitive dependency graphs.
The binaries and any scripts they run have the `agent` account's network,
filesystem, and credential access. Checksums detect changed downloads; they do
not establish that an upstream release is safe. pnpm can execute package install
scripts when allowed.

The alternative is to install each upstream distribution manually and maintain
its download verification, PATH, and update procedure separately.

## Manual deployment

Requires mise 2026.11.7 at `/home/agent/.local/bin/mise`. Its pinned download URL
and SHA-256 are recorded beside that executable in `mise.source.json`.

Run these commands from the personal account. Existing destination files cause
`ln` to fail; inspect them before replacing anything.

```fish
sudo install -d -o agent -g agent /home/agent/.config/mise
sudo -u agent ln -sT /home/abraxas/code/dotfiles/server/agent-runtime/mise.toml /home/agent/.config/mise/config.toml
sudo -u agent ln -sT /home/abraxas/code/dotfiles/server/agent-runtime/mise.lock /home/agent/.config/mise/mise.lock
sudo -iu agent /home/agent/.local/bin/mise install --locked
sudo -iu agent /home/agent/.local/bin/mise exec -- node --version
sudo -iu agent /home/agent/.local/bin/mise exec -- bun --version
sudo -iu agent /home/agent/.local/bin/mise exec -- pnpm --version
sudo -iu agent /home/agent/.local/bin/mise exec -- opencode --version
sudo -iu agent /home/agent/.local/bin/mise exec -- qmd --version
```

## OpenCode service

After the version checks pass, switch the `agent` service to the managed tools.
Changing service settings stops the running agent server; wait for its active
work to finish first. These commands preserve its existing port and credentials.

```fish
sudo -iu agent /home/agent/.local/bin/mise reshim
sudo -iu agent /home/agent/.local/bin/mise exec -- opencode service set env PATH /home/agent/.local/share/mise/shims:/home/agent/.local/bin:/home/agent/.bun/bin:/usr/local/bin:/usr/bin:/bin
sudo -iu agent /home/agent/.local/bin/mise exec -- opencode service set env TMPDIR /home/agent/tmp
sudo -iu agent /home/agent/.local/bin/mise exec -- opencode service start
sudo -iu agent /home/agent/.local/bin/mise exec -- opencode service status
sudo -iu agent /home/agent/.local/bin/mise exec -- opencode mcp list
```

The agent service should still use port `49375`. If an MCP list is initially
empty, retry after startup. Inspect individual errors if connections fail.

Start an interactive session with:

```fish
sudo -iu agent /home/agent/.local/bin/mise exec -- opencode /home/agent/code/takt
```

## QMD connection

Verify the agent-owned QMD installation against the existing index:

```fish
sudo -iu agent env QMD_CONFIG_DIR=/home/agent/code/takt/local-workspace/.qmd INDEX_PATH=/home/agent/code/takt/local-workspace/.qmd/index.sqlite /home/agent/.local/bin/mise exec -- qmd status
```

After that succeeds, inspect `/home/agent/.bun/bin/qmd`. If it is the old symlink
to `/opt/opencode-agent/qmd`, switch it to the mise shim:

```fish
sudo -iu agent /home/agent/.local/bin/mise reshim
sudo -u agent ln -sfnT /home/agent/.local/share/mise/shims/qmd /home/agent/.bun/bin/qmd
sudo -iu agent /home/agent/.local/bin/mise exec -- opencode reload
sudo -iu agent /home/agent/.local/bin/mise -C /home/agent/code/takt exec -- opencode mcp list
```

This keeps the shared MCP command's existing path while mise selects the
configured QMD version. Verify both MCP startup and a semantic query after
reconnecting QMD; `status` does not test model availability or native inference.

Shell PATH deployment remains a separate migration step.
Keep `/opt/opencode-agent` until the new service and MCP connections are verified.

## Updates

Review the intended upstream release, edit the exact version in `mise.toml`, then
regenerate the lockfile from this directory with an installed mise:

```fish
mise lock --platform linux-arm64
chmod 644 mise.lock
```

Mise may create or replace the lockfile with mode `0600`. It contains public
download metadata and must be readable by `agent` through the shared symlink.
Check its permissions after each regeneration; Git does not preserve this mode.

Review and commit `mise.toml` and `mise.lock` together. Deploy with the same
`mise install --locked` command above and verify the versions. Restart affected
long-running processes after their runtime changes. Keep previous installations
until those checks pass so the prior pins can be restored.

Use mise to update managed tools; `bun upgrade` or `pnpm self-update` would bypass
these pins. Mise itself is updated separately after reviewing and verifying its
next exact release.
