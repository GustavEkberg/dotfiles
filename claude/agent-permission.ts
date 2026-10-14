import { join } from "node:path"
import { agent, agentDecision, object } from "./adapter"

try {
  const name = process.argv[2]
  if (!name || !/^[a-z0-9-]+$/.test(name)) throw new Error("Invalid agent name")
  const root = join(import.meta.dir, "..")
  const definition = agent(await Bun.file(join(root, "opencode/agent", `${name}.md`)).text())
  const decision = agentDecision(definition.metadata, object(await Bun.stdin.json()))
  if (decision === "deny" || decision === "ask") {
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: decision,
        permissionDecisionReason: `OpenCode ${name} agent permissions`,
      },
    }))
  }
  // Allowed calls still pass through Claude's session-wide permission rules.
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(2)
}
