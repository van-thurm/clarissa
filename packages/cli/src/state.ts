import fs from 'fs/promises'
import path from 'path'
import type { PaletteKey } from '@clarissa/core'
import { DEFAULT_PALETTE, PALETTE_KEYS } from '@clarissa/core'

const CLARISSA_DIR = path.join(process.env.HOME ?? '/tmp', '.clarissa')
const STATE_FILE = path.join(CLARISSA_DIR, 'state.json')

export interface PlanetData {
  sign: string
  degree: number
}

export interface ChartData {
  userName: string
  birthDate: string
  birthTime: string
  birthPlace: string
  sun: PlanetData
  moon: PlanetData
  rising: PlanetData
  mercury: PlanetData
  venus: PlanetData
  mars: PlanetData
  jupiter: PlanetData
  saturn: PlanetData
  uranus: PlanetData
  neptune: PlanetData
  pluto: PlanetData
}

interface State {
  palette: PaletteKey
  icon?: string
  dir?: string
  chart?: ChartData
  location?: string
  goCommand?: string
  reposDir?: string
}

async function readState(): Promise<State> {
  const raw = await fs.readFile(STATE_FILE, 'utf-8').catch(() => null)
  if (!raw) return { palette: DEFAULT_PALETTE }
  try {
    const parsed = JSON.parse(raw) as Partial<State>
    const palette = parsed.palette && PALETTE_KEYS.includes(parsed.palette)
      ? parsed.palette
      : DEFAULT_PALETTE
    return { palette, icon: parsed.icon, dir: parsed.dir, chart: parsed.chart, location: parsed.location, goCommand: parsed.goCommand, reposDir: parsed.reposDir }
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

export async function getActiveDir(): Promise<string | undefined> {
  const state = await readState()
  return state.dir
}

export async function setActiveDir(dir: string): Promise<void> {
  const state = await readState()
  await writeState({ ...state, dir })
}

export async function getChart(): Promise<ChartData | undefined> {
  const state = await readState()
  return state.chart
}

export async function setChart(chart: ChartData): Promise<void> {
  const state = await readState()
  await writeState({ ...state, chart })
}

export async function getLocation(): Promise<string | undefined> {
  const state = await readState()
  return state.location
}

export async function setLocation(location: string): Promise<void> {
  const state = await readState()
  await writeState({ ...state, location })
}

export async function getGoCommand(): Promise<string | undefined> {
  const state = await readState()
  return state.goCommand
}

export async function setGoCommand(cmd: string): Promise<void> {
  const state = await readState()
  await writeState({ ...state, goCommand: cmd })
}

export async function getReposDir(): Promise<string | undefined> {
  const state = await readState()
  return state.reposDir
}

export async function setReposDir(dir: string): Promise<void> {
  const state = await readState()
  await writeState({ ...state, reposDir: dir })
}
