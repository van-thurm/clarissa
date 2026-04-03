import type { Icon, PaletteKey } from './types.js'
import { PALETTES, DEFAULT_PALETTE } from './palettes.js'

const FILLED = '\u2588\u2588'

function isBlockArt(icon: Icon): boolean {
  return icon.size > 0 && icon.rows.some(r => r.includes('\u2588'))
}

/**
 * Render an icon to an ANSI string ready to print.
 * Block art: colors ██ characters with palette fill.
 * Character art: colors all non-space characters with palette fill.
 * mono palette (fill=null): prints raw characters with no color codes.
 */
export function renderIcon(icon: Icon, paletteKey: PaletteKey = DEFAULT_PALETTE): string {
  const palette = PALETTES[paletteKey]

  if (palette.fill === null) {
    return icon.rows.join('\n')
  }

  const open = `\x1b[38;5;${palette.fill}m`
  const close = '\x1b[0m'

  if (isBlockArt(icon)) {
    const colored = `${open}${FILLED}${close}`
    return icon.rows
      .map(row => row.replaceAll(FILLED, colored))
      .join('\n')
  }

  return icon.rows
    .map(row => row.split('').map(ch => ch === ' ' ? ch : `${open}${ch}${close}`).join(''))
    .join('\n')
}
