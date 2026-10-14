#!/bin/sh

jq -c '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    updatedInput: (.tool_input + { rerank: false })
  }
}'
