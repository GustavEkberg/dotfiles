# Server Settings

Host/server-specific config lives here: local model server commands, systemd units, and Fish overrides.

## Layout

```text
server/
|-- commands/   # executable command wrappers, e.g. local-llama-server
|-- services/   # service manager units, e.g. local-llama-server.service
|-- opencode/   # legacy OpenCode plugin files; no root config
`-- fish/       # server-specific Fish config fragments
```

Manual deployment only. Copy or symlink files into the active host locations yourself.

Do not commit secrets, tokens, private hostnames, or machine-local credentials. Put those in ignored `server/local/` files or keep them outside the repo.

## OpenCode

Use the shared sources in `../opencode/`: `opencode.json` for server/project settings and `cli.json` for V2 terminal preferences. Agents, commands, skills, and plugins also live there.

The separate `server/opencode/opencode.jsonc` was removed. If a server's active config symlink points there, replace it manually with the shared source. Pulling this repo alone leaves that old symlink broken.

The remaining `server/opencode/plugins/qmd-no-rerank.ts` uses the V1 plugin API; use the shared plugin in `../opencode/plugins/` for V2.

## Local llama.cpp

`commands/llama-docker-server` is the tracked source for the active `~/.local/bin/llama-docker-server` symlink. It is tuned for this server's NVIDIA GB10 unified-memory setup, not copied directly from the RTX 5090 Reddit profile:

- `131072` context
- `q8_0` KV cache and `32768` MB prompt cache RAM; this host has `121GiB` RAM
- MTP speculative decoding with a conservative `6` draft tokens and `0.5` draft acceptance floor
- `2048` batch and `512` ubatch as the current baseline
- `parallel=1`, because MTP and multi-slot concurrency are not a good fit
- checkpoint settings intended to reduce hybrid/SWA prompt reprocessing

Logging is enabled by default so Docker logs expose startup warnings, prompt/eval timing, graph reuse, and MTP draft acceptance. Set `LLAMA_LOG_DISABLE=1` to restore quiet mode. `--mlock` and `--cache-reuse` are opt-in via `LLAMA_MLOCK=1` and `LLAMA_CACHE_REUSE=<tokens>` because the current GB10/Qwen3.6 context either rejects or ignores them.

Use a recent llama.cpp build. For Qwen3.6 hybrid/sliding-window models, patched prompt-cache handling may be required; watch logs for `forcing full prompt re-processing due to lack of cache data`.

The wrapper's model-limit sync still targets `~/.config/opencode/opencode.jsonc` and requires plain JSON. The shared config contains comments; use `--no-sync-opencode` with it until the wrapper's parser is updated.

Override any knob with environment variables, for example:

```sh
LLAMA_MODEL=/models/model.gguf LLAMA_CTX_SIZE=131072 LLAMA_BATCH_SIZE=2048 llama-docker-server
```
