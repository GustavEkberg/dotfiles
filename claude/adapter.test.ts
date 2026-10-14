import { describe, expect, test } from "bun:test"
import { agent, agentDecision, mcp, object, permissions } from "./adapter"

describe("Claude adaptation", () => {
  test("parses OpenCode agents without a Claude name field", () => {
    const parsed = agent("---\ndescription: Audit\npermission:\n  edit: deny\n---\nRead only.\n")
    expect(parsed.metadata.description).toBe("Audit")
    expect(parsed.body).toBe("Read only.\n")
  })

  test("uses absolute Claude paths for global file permissions", () => {
    const result = permissions({
      read: { "*.env": "deny", "secrets/*": "deny" },
      edit: { "/tmp/*": "allow" },
    }, [])
    expect(result.deny).toEqual(["Read(//**/*.env)", "Read(//**/secrets/**)"])
    expect(result.allow).toEqual(["Edit(//tmp/**)"])
  })

  test("rejects rule ordering Claude cannot preserve", () => {
    expect(() => permissions({ bash: { "*": "deny", "git log*": "allow" } }, []))
      .toThrow("precedence")
  })

  test("maps MCP tool denies to the local plugin namespace", () => {
    expect(permissions({ playwright_browser_run_code_unsafe: "deny" }, ["playwright"]).deny)
      .toEqual(["mcp__plugin_opencode_playwright__browser_run_code_unsafe"])
  })

  test("keeps disabled MCP servers off and credentials unresolved", () => {
    const result = object(mcp({
      local: { type: "local", command: ["server", "--stdio"], environment: { KEY: "{env:KEY}" } },
      remote: { type: "remote", url: "https://example.test/mcp", headers: { Authorization: "Bearer {env:TOKEN}" } },
      disabled: { enabled: false },
    }).mcpServers)
    expect(Object.keys(result)).toEqual(["local", "remote"])
    expect(object(result.local).env).toEqual({ KEY: "${KEY}" })
    expect(object(result.remote).headers).toEqual({ Authorization: "Bearer ${TOKEN}" })
  })

  test("rejects unsupported MCP fields rather than silently losing restrictions", () => {
    expect(() => mcp({ server: { type: "local", command: ["server"], auth: true } }))
      .toThrow("server.auth")
  })
})

describe("canonical agent permissions", () => {
  const metadata = { permission: { edit: "deny", bash: { "*": "deny", "git log*": "allow", "ls *": "allow" } } }
  const call = (command: string) => ({ tool_name: "Bash", tool_input: { command } })

  test("allows whitelisted reads but denies unrelated commands", () => {
    expect(agentDecision(metadata, call("git log --oneline -10"))).toBe("allow")
    expect(agentDecision(metadata, call("git push"))).toBe("deny")
  })

  test("does not let prefix allowlists approve compound commands or substitutions", () => {
    for (const command of ["git log; rm -rf .", "git log && git push", "git log $(touch file)", "git log > file"]) {
      expect(agentDecision(metadata, call(command))).toBe("deny")
    }
  })

  test("applies edit denial to every file-writing tool", () => {
    for (const tool_name of ["Edit", "Write", "NotebookEdit"]) {
      expect(agentDecision(metadata, { tool_name, tool_input: {} })).toBe("deny")
    }
  })
})
