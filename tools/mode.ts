import os from "os"
import path from "path"
import fs from "fs"

export type CavemanLevel = "lite" | "full" | "ultra" | "off"

const STATE_FILENAME = ".caveman-active"

function statePath(): string {
  return path.join(os.homedir(), ".config", "opencode", STATE_FILENAME)
}

export function loadActiveLevel(): CavemanLevel {
  try {
    const raw = fs.readFileSync(statePath(), "utf-8").trim()
    if (isValidLevel(raw)) return raw
  } catch {
    // file absent = default on
  }
  return "full"
}

export function saveActiveLevel(level: CavemanLevel): void {
  const file = statePath()
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, level, "utf-8")
}

function isValidLevel(value: string): value is CavemanLevel {
  return value === "lite" || value === "full" || value === "ultra" || value === "off"
}
