import fs from 'fs/promises'
import path from 'path'
import type { PaletteKey } from '@clarissa/core'
import { DEFAULT_PALETTE, PALETTE_KEYS } from '@clarissa/core'

const CLARISSA_DIR = path.join(process.env.HOME ?? '/tmp', '.clarissa')
const STATE_FILE = path.join(CLARISSA_DIR, 'state.json')

interface State {
  palette: PaletteKey
  icon?: string  // name of most-recently-added icon
}

async function readState(): Promise<State> {
  const raw = await fs.readFile(STATE_FILE, 'utf-8').catch(() => null)
  if (!raw) return { palette: DEFAULT_PALETTE }
  try {
    const parsed = JSON.parse(raw) as Partial<State>
    const palette = parsed.palette && PALETTE_KEYS.includes(parsed.palette)
      ? parsed.palette
      : DEFAULT_PALETTE
    return { palette }
  } catch {
    return { palette: DEFAULT_PALETTE }
  }
}

async function writeState(state: State): Promise<void> {
  await fs.mkdir(CLARISSA_DIR, { recursive: true })
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2))
}

export async function getActivePalette(): Promise<PaletteKey> {
  const state = await readState()
  return state.palette
}

export async function setActivePalette(palette: PaletteKey): Promise<void> {
  const state = await readState()
  await writeState({ ...state, palette })
}

export async function getActiveIcon(): Promise<string | undefined> {
  const state = await readState()
  return state.icon
}

export async function setActiveIcon(name: string): Promise<void> {
  const state = await readState()
  await writeState({ ...state, icon: name })
}
