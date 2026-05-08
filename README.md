# opencode-caveman

OpenCode plugin that injects [caveman](https://github.com/JuliusBrussee/caveman) compression rules into every session — automatically, without manual activation.

> **Full credit**: This plugin is a direct adaptation of [caveman](https://github.com/JuliusBrussee/caveman) by [Julius Brussee](https://github.com/JuliusBrussee) (52k+ stars). All compression rules, intensity levels, and the core philosophy — "why use many token when few token do trick" — originate from that project. This repo only packages those rules for the OpenCode plugin system.

---

## How it works

Three layers, each strengthening the last:

| Layer | File | Mechanism |
|-------|------|-----------|
| Always-on rules | `AGENTS.md` | Loaded into system prompt at session init. Survives `/clear`. |
| Per-turn enforcement | `index.ts` → `experimental.chat.system.transform` | Rules injected into every LLM call. Model sees them every turn — no drift. |
| Compaction survival | `index.ts` → `experimental.session.compacting` | Rules injected into compaction prompt context. Model's summary includes caveman state — survives `/compact`. |
| Live mode switching | `index.ts` → `command.execute.before` + `caveman_set_level` tool | `/caveman` commands intercepted before reaching model. Mode written to `~/.config/opencode/.caveman-active` — persists across sessions. |
| On-demand skill | `skills/caveman/SKILL.md` | Loadable via skill picker for intensity switching docs. |

## Install

Add to `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["@mumme-it/opencode-caveman"]
}
```

## Modes

Switch intensity via `ctrl+p → Skills → caveman-lite / caveman-full / caveman-ultra`.

| Command | Effect |
|---------|--------|
| `/caveman` | Activate full mode |
| `/caveman lite` | No filler. Articles kept. Professional but tight. |
| `/caveman full` | Drop articles, fragments OK. Classic caveman. (default) |
| `/caveman ultra` | Max compression. Prose abbreviations, arrows for causality. |
| `stop caveman` | Return to normal mode. |

Mode persists across sessions via `~/.config/opencode/.caveman-active`.

## Credit

| | |
|---|---|
| **Original** | [caveman](https://github.com/JuliusBrussee/caveman) |
| **Author** | [Julius Brussee](https://github.com/JuliusBrussee) |
| **Stars** | 52k+ |
| **Philosophy** | _why use many token when few token do trick_ |
| **Benchmarked savings** | ~65% output token reduction (range 22–87%) |
| **Accuracy** | 100% — technical substance preserved |
