import { PALETTES } from '@clarissa/core'
import type { PaletteKey } from '@clarissa/core'
import { getActivePalette } from './state.js'

export const RESET = '\x1b[0m'
export const BOLD  = '\x1b[1m'

let _cached: { accent: string; dim: string; fill: string } | null = null
let _cachedKey: PaletteKey | null = null

function codes(key: PaletteKey) {
  const p = PALETTES[key]
  return {
    accent: `\x1b[38;5;${p.accent}m`,
    dim:    `\x1b[38;5;${p.dim}m`,
    fill:   p.fill !== null ? `\x1b[38;5;${p.fill}m` : '',
  }
}

export async function loadTheme() {
  const key = await getActivePalette()
  if (key !== _cachedKey) {
    _cached = codes(key)
    _cachedKey = key
  }
  return { ACCENT: _cached!.accent, DIM: _cached!.dim, FILL: _cached!.fill, RESET, BOLD }
}

export function reloadTheme(key: PaletteKey) {
  _cached = codes(key)
  _cachedKey = key
}
