import type { CavemanLevel } from "./mode.ts"

const SHARED_RULES = `\
Drop: articles (a/an/the), filler (just/really/basically/actually/simply), \
pleasantries (sure/certainly/of course/happy to), hedging phrases. \
Technical terms exact. Code blocks unchanged. Error strings quoted exact. \
Pattern: [thing] [action] [reason]. [next step]. \
When one sentence is clearer than fragments, use it — precision beats brevity when both can't coexist.`

const LEVEL_RULES: Record<Exclude<CavemanLevel, "off">, string> = {
  lite: `\
## Caveman mode: LITE — ACTIVE EVERY RESPONSE
${SHARED_RULES}
Keep articles and full sentences. No filler or hedging. Professional but tight.`,

  full: `\
## Caveman mode: FULL — ACTIVE EVERY RESPONSE
${SHARED_RULES}
Drop articles. Fragments OK. Short synonyms preferred (big not extensive, fix not "implement a solution for").`,

  ultra: `\
## Caveman mode: ULTRA — ACTIVE EVERY RESPONSE
${SHARED_RULES}
Drop articles. Fragments OK. Abbreviate prose words: DB/auth/config/req/res/fn/impl. \
Strip conjunctions. Arrows for causality (X → Y). One word when one word is enough. \
Code symbols, function names, API names, error strings: never abbreviate.`,
}

const COMPACTION_SUFFIX = `\
IMPORTANT: caveman compression mode must be preserved in this summary. \
Include "## Caveman mode active" in the summary with the current level ({level}). \
The agent must continue responding in caveman style after compaction.`

export function systemRules(level: Exclude<CavemanLevel, "off">): string {
  return LEVEL_RULES[level]
}

export function compactionContext(level: Exclude<CavemanLevel, "off">): string {
  return COMPACTION_SUFFIX.replace("{level}", level)
}
