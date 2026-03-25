---
name: parse-claude-output
description: Parse claude code CLI stream-json output into readable format. Use when building tools that consume claude -p output programmatically or display it in a dashboard/TUI.
---

# Parse Claude Code Output

Reference for consuming `claude -p` (print/headless mode) output programmatically.

## Getting streaming output

`claude -p` buffers all output by default. To get real-time streaming:

```
claude -p '<prompt>' --verbose --output-format stream-json
```

Both `--verbose` AND `--output-format stream-json` are required together.

### Useful flags for headless execution

- `--allowedTools Bash Read Write Edit Glob Grep Skill` — allow tools without prompting
- `--dangerously-skip-permissions` — bypass all permission checks (sandbox only)
- `--model <model>` — claude uses `claude-opus-4-6`, `opus`, `sonnet` (NOT `anthropic/` prefix)
- `--include-partial-messages` — also emit `stream_event` deltas for real-time token streaming

## Stream-JSON format

Newline-delimited JSON. Each line has a `type` field.

### Event types

| Type | When | Key fields |
|------|------|------------|
| `system` (subtype: `init`) | First line | `tools`, `model`, `session_id` — very large, usually suppress |
| `assistant` | After each assistant turn | `message.content[]` — array of content blocks |
| `user` | After tool execution | `message.content[]` — contains `tool_result` blocks |
| `result` | Final line | `result` (text), `usage`, `total_cost_usd`, `duration_ms` |
| `rate_limit_event` | After API calls | `rate_limit_info` — usually suppress |

### Content block types (inside `message.content[]`)

| Block type | Parent | Key fields | Description |
|------------|--------|------------|-------------|
| `thinking` | assistant | `thinking`, `signature` | Extended thinking / reasoning |
| `text` | assistant | `text` | Assistant's visible text output |
| `tool_use` | assistant | `name`, `input`, `id` | Tool call (Bash, Read, Edit, etc.) |
| `tool_result` | user | `tool_use_id`, `content` | Tool execution result |

### Example: assistant turn with thinking + tool call

```json
{"type":"assistant","message":{"model":"claude-opus-4-6","role":"assistant","content":[
  {"type":"thinking","thinking":"Let me read the config file...","signature":"..."},
  {"type":"tool_use","id":"toolu_abc","name":"Read","input":{"file_path":"/app/config.json"}}
],...}}
```

### Example: user turn with tool result

```json
{"type":"user","message":{"role":"user","content":[
  {"type":"tool_result","tool_use_id":"toolu_abc","content":"{\"port\": 3000}"}
]}}
```

### Example: final result

```json
{"type":"result","subtype":"success","result":"Done.","duration_ms":12000,"total_cost_usd":0.05,"usage":{...}}
```

## Parsing strategy

1. Read lines, parse each as JSON
2. Switch on `type` field
3. For `assistant`: iterate `message.content[]`, handle each block type
4. For `user`: iterate `message.content[]`, extract `tool_result` blocks
5. Suppress `system init` (huge) and `rate_limit_event` (noise)

### Tool input summaries

Extract the most useful field per tool for compact display:

| Tool | Show field |
|------|-----------|
| `Bash` | `input.command` |
| `Read` | `input.file_path` |
| `Write` | `input.file_path` |
| `Edit` | `input.file_path` |
| `Grep` | `input.pattern` |
| `Glob` | `input.pattern` |
| `Skill` | `input.skill` |
| `Agent` | `input.description` |

### Tool result content

The `content` field in `tool_result` can be:
- A **string** — plain text result
- An **array** of `{"type":"text","text":"..."}` blocks — extract and join text fields

## Reference implementation

See `rool` repo `streamjson.go` for a complete Go implementation that:
- Parses all event types into readable dashboard output
- Shows thinking blocks (truncated), tool calls with summaries, tool results
- Suppresses noisy events (init, rate limits)
- Handles both string and array tool result formats
