import type { Icon, PaletteKey } from './types.js'
import { PALETTES, DEFAULT_PALETTE } from './palettes.js'

const FILLED = '\u2588\u2588'

/**
 * Render an icon to an ANSI string ready to print.
 * mono palette: raw ██ characters, identical to current bash tool output.
 * Other palettes: wrap filled blocks in ANSI 256-color codes.
 */
export function renderIcon(icon: Icon, paletteKey: PaletteKey = DEFAULT_PALETTE): string {
  const palette = PALETTES[paletteKey]

  if (palette.color === null) {
    return icon.rows.join('\n')
  }

  const open = `\x1b[38;5;${palette.color}m`
  const close = '\x1b[0m'
  const colored = `${open}${FILLED}${close}`

  return icon.rows
    .map(row => row.replaceAll(FILLED, colored))
    .join('\n')
}
