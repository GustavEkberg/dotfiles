import { join } from "node:path"

export type ObjectValue = Record<string, unknown>

function isObject(value: unknown): value is ObjectValue {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function object(value: unknown): ObjectValue {
  if (!isObject(value)) throw new Error("Expected an object")
  return value
}

export function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("Expected a string")
  return value
}

export function strings(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error("Expected an array")
  return value.map(text)
}

export function expand(path: string): string {
  const home = process.env.HOME
  if (!home) throw new Error("HOME is required")
  return path.startsWith("~/") ? join(home, path.slice(2)) : path
}

export const tools: Record<string, string> = {
  read: "Read",
  edit: "Edit",
  bash: "Bash",
  glob: "Glob",
  grep: "Grep",
  task: "Agent",
  webfetch: "WebFetch",
  websearch: "WebSearch",
  skill: "Skill",
  lsp: "LSP",
  todowrite: "TodoWrite",
  question: "AskUserQuestion",
}

export function mcpTool(name: string, servers: string[]): string {
  for (const server of servers) {
    if (name.startsWith(`${server}_`)) {
      return `mcp__plugin_opencode_${server}__${name.slice(server.length + 1)}`
    }
  }
  throw new Error(`No Claude tool mapping for ${name}`)
}

function filePattern(pattern: string): string {
  // OpenCode globs span path separators; Claude uses gitignore path segments.
  const recursive = pattern.split("/").map((part) => part === "*" ? "**" : part).join("/")
  if (recursive.startsWith("~/")) return recursive
  if (recursive.startsWith("/")) return `/${recursive}`
  return `//**/${recursive}`
}

export function permissions(source: ObjectValue, servers: string[]): ObjectValue {
  const lists: Record<string, string[]> = { allow: [], ask: [], deny: [] }
  const directories = new Set<string>()
  for (const [name, value] of Object.entries(source)) {
    const rules = typeof value === "string" ? { "*": value } : object(value)
    let priority = -1
    for (const [pattern, rawAction] of Object.entries(rules)) {
      const action = text(rawAction)
      const list = lists[action]
      const nextPriority = ["allow", "ask", "deny"].indexOf(action)
      if (!list || nextPriority < priority) {
        throw new Error(`Cannot preserve Claude deny/ask/allow precedence for ${name}: ${pattern}`)
      }
      priority = nextPriority
      if (name === "external_directory") {
        if (action !== "allow") throw new Error("External-directory restrictions need a native Claude adapter")
        const directory = pattern.replace(/\/\*\*?$/, "")
        if (directory.includes("*") || !/^(\/|~\/)/.test(directory)) {
          throw new Error(`Cannot grant a directory glob to Claude: ${pattern}`)
        }
        directories.add(expand(directory))
        continue
      }
      const tool = tools[name] ?? mcpTool(name, servers)
      if (tool.startsWith("mcp__")) {
        if (pattern !== "*") throw new Error("Claude settings cannot scope MCP permissions by input")
        list.push(tool)
        continue
      }
      const specifier = name === "read" || name === "edit" ? filePattern(pattern) : pattern
      list.push(pattern === "*" ? tool : `${tool}(${specifier})`)
    }
  }
  return { ...lists, additionalDirectories: [...directories] }
}

export function mcp(source: ObjectValue): ObjectValue {
  const servers: ObjectValue = {}
  for (const [name, raw] of Object.entries(source)) {
    const server = object(raw)
    if (server.enabled === false) continue
    for (const key of Object.keys(server)) {
      if (!["type", "command", "environment", "url", "headers", "enabled", "timeout"].includes(key)) {
        throw new Error(`Unsupported MCP field: ${name}.${key}`)
      }
    }
    let result: ObjectValue
    if (server.type === "local") {
      const [command, ...args] = strings(server.command)
      if (!command) throw new Error(`Missing MCP command: ${name}`)
      result = { type: "stdio", command, args }
      if (server.environment !== undefined) result.env = object(server.environment)
    } else if (server.type === "remote") {
      result = { type: "http", url: text(server.url) }
      if (server.headers !== undefined) result.headers = object(server.headers)
    } else {
      throw new Error(`Unsupported MCP transport: ${name}`)
    }
    if (server.timeout !== undefined) result.timeout = server.timeout
    // Preserve interpolation without expanding credentials into generated files.
    servers[name] = object(JSON.parse(JSON.stringify(result).replace(/\{env:([A-Za-z_][A-Za-z0-9_]*)\}/g, "${$1}")))
    if (JSON.stringify(servers[name]).includes("{file:")) {
      throw new Error(`File interpolation needs an explicit Claude adapter: ${name}`)
    }
  }
  return { mcpServers: servers }
}

export function agent(markdown: string): { metadata: ObjectValue; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(markdown)
  if (!match || match[1] === undefined || match[2] === undefined) {
    throw new Error("Agent requires YAML frontmatter")
  }
  return { metadata: object(Bun.YAML.parse(match[1])), body: match[2] }
}

function wildcard(pattern: string, value: string): boolean {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")
  return new RegExp(`^${escaped}$`, "s").test(value)
}

export function agentDecision(metadata: ObjectValue, input: ObjectValue): string | undefined {
  const name = text(input.tool_name)
  const tool = name === "Write" || name === "NotebookEdit" ? "edit"
    : Object.keys(tools).find((key) => tools[key] === name)
  const rules = object(metadata.permission)[tool ?? name]
  if (rules === undefined) return
  if (typeof rules === "string") return rules
  if (tool !== "bash") throw new Error(`Scoped agent permission needs an adapter: ${name}`)
  const command = text(object(input.tool_input).command)
  // A prefix allowlist must never approve a second command or shell expansion.
  // Compound commands can be issued as separate tool calls instead.
  if (/[;&|\n\r<>$`]/.test(command)) return "deny"
  let decision: string | undefined
  for (const [pattern, action] of Object.entries(object(rules))) {
    if (wildcard(pattern, command)) decision = text(action)
  }
  return decision
}
