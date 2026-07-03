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

## Local llama.cpp

`commands/llama-docker-server` is the tracked source for the active `~/.local/bin/llama-docker-server` symlink. It is tuned for this server's NVIDIA GB10 unified-memory setup, not copied directly from the RTX 5090 Reddit profile:

- `131072` context, matching the OpenCode model limit
- `q8_0` KV cache and `32768` MB prompt cache RAM; this host has `121GiB` RAM
- MTP speculative decoding with a conservative `6` draft tokens and `0.5` draft acceptance floor
- `2048` batch and `512` ubatch as the current baseline
- `parallel=1`, because MTP and multi-slot concurrency are not a good fit
- checkpoint settings intended to reduce hybrid/SWA prompt reprocessing

Logging is enabled by default so Docker logs expose startup warnings, prompt/eval timing, graph reuse, and MTP draft acceptance. Set `LLAMA_LOG_DISABLE=1` to restore quiet mode. `--mlock` and `--cache-reuse` are opt-in via `LLAMA_MLOCK=1` and `LLAMA_CACHE_REUSE=<tokens>` because the current GB10/Qwen3.6 context either rejects or ignores them.

Use a recent llama.cpp build. For Qwen3.6 hybrid/sliding-window models, patched prompt-cache handling may be required; watch logs for `forcing full prompt re-processing due to lack of cache data`.

Override any knob with environment variables, for example:

```sh
LLAMA_MODEL=/models/model.gguf LLAMA_CTX_SIZE=131072 LLAMA_BATCH_SIZE=2048 llama-docker-server
```
