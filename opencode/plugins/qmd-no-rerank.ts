import type { Plugin as LegacyPlugin } from "@opencode-ai/plugin"
import type { Plugin } from "@opencode/plugin"

export default {
  id: "dotfiles.qmd-no-rerank",
  async setup(ctx) {
    await ctx.tool.hook("execute.before", (event) => {
      if (event.tool !== "qmd_query") return
      if (typeof event.input !== "object" || event.input === null || Array.isArray(event.input)) return
      event.input = { ...event.input, rerank: false }
    })
  },
  // Keep the retained v1 installation usable for rollback.
  server: async () => ({
    "tool.execute.before": async (input, output) => {
      if (input.tool === "qmd_query") output.args.rerank = false
    },
  }),
} satisfies Plugin.Plugin & { server: LegacyPlugin }
