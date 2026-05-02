import { fileURLToPath } from "url"
import path from "path"
import type { Plugin, ToolContext } from "@opencode-ai/plugin"
import type { Part } from "@opencode-ai/sdk"
import { loadActiveLevel } from "./tools/mode.ts"
import { systemRules, compactionContext } from "./tools/rules.ts"
import { caveman_set_level } from "./tools/set-level.ts"
import type { CavemanLevel } from "./tools/mode.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SKILLS_DIR = path.resolve(__dirname, "..", "..", "skills")

const COMMAND_ALIASES: Record<string, CavemanLevel> = {
  "caveman": "full",
  "caveman lite": "lite",
  "caveman full": "full",
  "caveman ultra": "ultra",
  "caveman-lite": "lite",
  "caveman-full": "full",
  "caveman-ultra": "ultra",
  "caveman-off": "off",
  "stop caveman": "off",
  "normal mode": "off",
}

/**
 * Returns the target CavemanLevel if the command+args string matches a caveman
 * command, or null if it is unrelated.
 */
function parseCavemanCommand(command: string, args: string): CavemanLevel | null {
  const raw = args.trim() ? `${command} ${args.trim()}` : command
  const normalized = raw.toLowerCase().trim()
  return COMMAND_ALIASES[normalized] ?? null
}

export const CavemanPlugin: Plugin = async (_ctx) => {
  return {
    tool: {
      caveman_set_level,
    },

    /**
     * Register the plugin's skills/ directory so opencode discovers
     * caveman-lite, caveman-full, caveman-ultra, caveman-off skills.
     */
    config: async (config: any) => {
      config.skills = config.skills || {}
      config.skills.paths = config.skills.paths || []
      if (!config.skills.paths.includes(SKILLS_DIR)) {
        config.skills.paths.push(SKILLS_DIR)
      }
    },

    /**
     * Inject caveman rules into the system prompt on every LLM call.
     * Equivalent to Claude Code's per-turn UserPromptSubmit hookSpecificOutput.
     * Rules are visible to the model every turn — prevents drift after /compact.
     */
    "experimental.chat.system.transform": async (_input, output) => {
      const level = loadActiveLevel()
      if (level === "off") return
      output.system.push(systemRules(level as Exclude<CavemanLevel, "off">))
    },

    /**
     * Shape the compaction summary to include caveman mode.
     * The model writes the summary — if we tell it to include caveman state,
     * the resulting summary will re-activate caveman on the next turn.
     */
    "experimental.session.compacting": async (_input, output) => {
      const level = loadActiveLevel()
      if (level === "off") return
      output.context.push(compactionContext(level as Exclude<CavemanLevel, "off">))
    },

    /**
     * Intercept /caveman commands before they reach the model.
     * Parses the command, switches mode, informs model via mutated parts.
     */
    "command.execute.before": async (input, output) => {
      const parsed = parseCavemanCommand(input.command, input.arguments)
      if (!parsed) return

      // Fire set-level logic directly — avoid a round-trip through the model.
      // ask() is never called by this tool so the cast is safe.
      const ctx = {
        sessionID: input.sessionID,
        messageID: "",
        agent: "",
        directory: "",
        worktree: "",
        abort: new AbortController().signal,
        metadata: () => {},
        ask: (() => {}) as unknown as ToolContext["ask"],
      }
      const result = await caveman_set_level.execute({ level: parsed }, ctx)

      output.parts.push({
        type: "text",
        id: crypto.randomUUID(),
        sessionID: input.sessionID,
        messageID: "",
        text: typeof result === "string" ? result : result.output,
      } as Part)
    },
  }
}
