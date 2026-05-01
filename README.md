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

This mirrors how the [original caveman](https://github.com/JuliusBrussee/caveman) works in Claude Code: SessionStart hook injects rules as hidden system context; UserPromptSubmit hook re-injects a small reminder every turn; flag file persists mode across sessions.

## Install

### Option A — plugin (full enforcement, recommended)

Build and copy to OpenCode's global plugin directory:

```sh
cd opencode-caveman
bun install
bun run build
cp .opencode/plugins/caveman.js ~/.config/opencode/plugins/caveman.js
```

Or reference from `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["@mumme-it/opencode-caveman"]
}
```

### Option B — AGENTS.md only (no code, simpler)

Copy `AGENTS.md` globally:

```sh
cp AGENTS.md ~/.config/opencode/AGENTS.md
```

Add to `~/.config/opencode/opencode.json`:

```json
{
  "instructions": ["AGENTS.md"]
}
```

Rules load at session start. No per-turn enforcement or compaction survival.

### Option C — skill only (on-demand)

```sh
cp -r skills/caveman ~/.config/opencode/skills/caveman
```

Activate per-session: `ctrl+p → Load Skill → caveman`.

## Modes

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
