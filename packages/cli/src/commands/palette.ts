import { PALETTES, PALETTE_KEYS } from '@clarissa/core'
import type { PaletteKey } from '@clarissa/core'
import { getActivePalette, setActivePalette } from '../state.js'
import { loadTheme, reloadTheme, RESET, BOLD } from '../theme.js'

function swatch(p: { fill: number | null; accent: number; dim: number }): string {
  const blk = '███'
  const f = p.fill !== null ? `\x1b[38;5;${p.fill}m${blk}${RESET}` : blk
  const a = `\x1b[38;5;${p.accent}m${blk}${RESET}`
  const d = `\x1b[38;5;${p.dim}m${blk}${RESET}`
  return `${f}${a}${d}`
}

export async function palette(name?: string): Promise<void> {
  const { ACCENT, DIM } = await loadTheme()

  if (name !== undefined) {
    if (!PALETTE_KEYS.includes(name as PaletteKey)) {
      throw new Error(`unknown palette: ${name}\n  options: ${PALETTE_KEYS.join(', ')}`)
    }
    const key = name as PaletteKey
    await setActivePalette(key)
    reloadTheme(key)
    const p = PALETTES[key]
    console.log(`\n  palette set to ${swatch(p)}  ${p.label}  — ${p.vibe}\n`)
    return
  }

  const active = await getActivePalette()
  console.log()
  for (const key of PALETTE_KEYS) {
    const p = PALETTES[key]
    const sw = swatch(p)
    const marker = key === active ? `  ${ACCENT}←${RESET}` : ''
    const nameCol = key.padEnd(12)
    console.log(`  ${sw}  ${nameCol}  ${DIM}${p.vibe}${RESET}${marker}`)
  }
  console.log()
  console.log(`  clarissa palette <name>  to switch\n`)
}
