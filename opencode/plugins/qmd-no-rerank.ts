import type { Plugin } from "@opencode-ai/plugin"

export default (async () => ({
  "tool.execute.before": async (input, output) => {
    if (input.tool === "qmd_query") output.args.rerank = false
  },
})) satisfies Plugin
