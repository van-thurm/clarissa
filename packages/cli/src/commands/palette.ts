import { PALETTES, PALETTE_KEYS } from '@clarissa/core'
import type { PaletteKey } from '@clarissa/core'
import { getActivePalette, setActivePalette } from '../state.js'

const FILLED = '\u2588\u2588'
const RESET = '\x1b[0m'

function colorSwatch(color: number | null): string {
  if (color === null) return FILLED
  return `\x1b[38;5;${color}m${FILLED}${RESET}`
}

export async function palette(name?: string): Promise<void> {
  if (name !== undefined) {
    if (!PALETTE_KEYS.includes(name as PaletteKey)) {
      throw new Error(`unknown palette: ${name}\n  options: ${PALETTE_KEYS.join(', ')}`)
    }
    const key = name as PaletteKey
    await setActivePalette(key)
    const p = PALETTES[key]
    console.log(`\n  palette set to ${colorSwatch(p.color)}  ${p.label}  — ${p.vibe}\n`)
    return
  }

  // List all palettes with swatches
  const active = await getActivePalette()
  console.log()
  for (const key of PALETTE_KEYS) {
    const p = PALETTES[key]
    const swatch = colorSwatch(p.color)
    const marker = key === active ? '  ←' : ''
    const nameCol = key.padEnd(8)
    console.log(`  ${swatch}  ${nameCol}  ${p.vibe}${marker}`)
  }
  console.log()
  console.log(`  clarissa palette <name>  to switch\n`)
}
