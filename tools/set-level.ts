import { tool } from "@opencode-ai/plugin"
import { saveActiveLevel, type CavemanLevel } from "./mode.ts"

const LEVEL_DESCRIPTIONS: Record<CavemanLevel, string> = {
  lite: "No filler or hedging. Articles kept. Professional but tight.",
  full: "Drop articles, fragments OK, short synonyms. Classic caveman. (default)",
  ultra: "Max compression. Prose abbreviations, arrows for causality (X → Y). Code/API names never abbreviated.",
  off: "Caveman mode disabled. Normal verbosity restored.",
}

export const caveman_set_level = tool({
  description:
    "Set the caveman compression level for all responses. " +
    "Use this when the user says /caveman, /caveman lite, /caveman full, /caveman ultra, " +
    "stop caveman, or normal mode. " +
    "Levels: lite (tight prose), full (classic caveman, default), ultra (maximum compression), off (disabled).",
  args: {
    level: tool.schema
      .enum(["lite", "full", "ultra", "off"])
      .describe("Compression level to activate"),
  },
  async execute(args) {
    const level = args.level as CavemanLevel
    saveActiveLevel(level)
    const desc = LEVEL_DESCRIPTIONS[level]
    if (level === "off") {
      return `Caveman mode disabled. Normal verbosity restored.`
    }
    return `Caveman mode set to '${level}'. ${desc} Active immediately — persists across sessions.`
  },
})
