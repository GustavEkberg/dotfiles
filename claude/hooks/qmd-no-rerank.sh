#!/bin/sh

jq -c '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "allow",
    permissionDecisionReason: "QMD reranking is disabled for this local index.",
    updatedInput: (.tool_input + { rerank: false })
  }
}'
