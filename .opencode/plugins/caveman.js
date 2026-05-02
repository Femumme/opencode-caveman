// tools/mode.ts
import os from "os";
import path from "path";
import fs from "fs";
var STATE_FILENAME = ".caveman-active";
function statePath() {
  return path.join(os.homedir(), ".config", "opencode", STATE_FILENAME);
}
function loadActiveLevel() {
  try {
    const raw = fs.readFileSync(statePath(), "utf-8").trim();
    if (isValidLevel(raw))
      return raw;
  } catch {}
  return "full";
}
function saveActiveLevel(level) {
  const file = statePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (level === "off") {
    try {
      fs.unlinkSync(file);
    } catch {}
  } else {
    fs.writeFileSync(file, level, "utf-8");
  }
}
function isValidLevel(value) {
  return value === "lite" || value === "full" || value === "ultra" || value === "off";
}

// tools/rules.ts
var SHARED_RULES = `Drop: articles (a/an/the), filler (just/really/basically/actually/simply), pleasantries (sure/certainly/of course/happy to), hedging phrases. Technical terms exact. Code blocks unchanged. Error strings quoted exact. Pattern: [thing] [action] [reason]. [next step]. When one sentence is clearer than fragments, use it — precision beats brevity when both can't coexist.`;
var LEVEL_RULES = {
  lite: `## Caveman mode: LITE — ACTIVE EVERY RESPONSE
${SHARED_RULES}
Keep articles and full sentences. No filler or hedging. Professional but tight.`,
  full: `## Caveman mode: FULL — ACTIVE EVERY RESPONSE
${SHARED_RULES}
Drop articles. Fragments OK. Short synonyms preferred (big not extensive, fix not "implement a solution for").`,
  ultra: `## Caveman mode: ULTRA — ACTIVE EVERY RESPONSE
${SHARED_RULES}
Drop articles. Fragments OK. Abbreviate prose words: DB/auth/config/req/res/fn/impl. Strip conjunctions. Arrows for causality (X → Y). One word when one word is enough. Code symbols, function names, API names, error strings: never abbreviate.`
};
var COMPACTION_SUFFIX = `IMPORTANT: caveman compression mode must be preserved in this summary. Include "## Caveman mode active" in the summary with the current level ({level}). The agent must continue responding in caveman style after compaction.`;
function systemRules(level) {
  return LEVEL_RULES[level];
}
function compactionContext(level) {
  return COMPACTION_SUFFIX.replace("{level}", level);
}

// tools/set-level.ts
import { tool } from "@opencode-ai/plugin";
var LEVEL_DESCRIPTIONS = {
  lite: "No filler or hedging. Articles kept. Professional but tight.",
  full: "Drop articles, fragments OK, short synonyms. Classic caveman. (default)",
  ultra: "Max compression. Prose abbreviations, arrows for causality (X → Y). Code/API names never abbreviated.",
  off: "Caveman mode disabled. Normal verbosity restored."
};
var caveman_set_level = tool({
  description: "Set the caveman compression level for all responses. " + "Use this when the user says /caveman, /caveman lite, /caveman full, /caveman ultra, " + "stop caveman, or normal mode. " + "Levels: lite (tight prose), full (classic caveman, default), ultra (maximum compression), off (disabled).",
  args: {
    level: tool.schema.enum(["lite", "full", "ultra", "off"]).describe("Compression level to activate")
  },
  async execute(args) {
    const level = args.level;
    saveActiveLevel(level);
    const desc = LEVEL_DESCRIPTIONS[level];
    if (level === "off") {
      return `Caveman mode disabled. Normal verbosity restored.`;
    }
    return `Caveman mode set to '${level}'. ${desc} Active immediately — persists across sessions.`;
  }
});

// index.ts
var COMMAND_ALIASES = {
  caveman: "full",
  "caveman lite": "lite",
  "caveman full": "full",
  "caveman ultra": "ultra",
  "caveman-lite": "lite",
  "caveman-full": "full",
  "caveman-ultra": "ultra",
  "caveman-off": "off",
  "stop caveman": "off",
  "normal mode": "off"
};
function parseCavemanCommand(command, args) {
  const raw = args.trim() ? `${command} ${args.trim()}` : command;
  const normalized = raw.toLowerCase().trim();
  return COMMAND_ALIASES[normalized] ?? null;
}
var CavemanPlugin = async (_ctx) => {
  return {
    tool: {
      caveman_set_level
    },
    "experimental.chat.system.transform": async (_input, output) => {
      const level = loadActiveLevel();
      if (level === "off")
        return;
      output.system.push(systemRules(level));
    },
    "experimental.session.compacting": async (_input, output) => {
      const level = loadActiveLevel();
      if (level === "off")
        return;
      output.context.push(compactionContext(level));
    },
    "command.execute.before": async (input, output) => {
      const parsed = parseCavemanCommand(input.command, input.arguments);
      if (!parsed)
        return;
      const ctx = {
        sessionID: input.sessionID,
        messageID: "",
        agent: "",
        directory: "",
        worktree: "",
        abort: new AbortController().signal,
        metadata: () => {},
        ask: () => {}
      };
      const result = await caveman_set_level.execute({ level: parsed }, ctx);
      output.parts.push({
        type: "text",
        id: crypto.randomUUID(),
        sessionID: input.sessionID,
        messageID: "",
        text: typeof result === "string" ? result : result.output
      });
    }
  };
};
export {
  CavemanPlugin
};
