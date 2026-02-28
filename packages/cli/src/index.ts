// Public library API — import { render, renderText } from 'hey-clarissa'

export { renderIcon, PALETTES, DEFAULT_PALETTE, PALETTE_KEYS } from '@clarissa/core'
export type { Icon, Palette, PaletteKey } from '@clarissa/core'
export { loadIcon, listIcons, saveIcon } from './store.js'
export { FEATURED_FONTS } from './commands/fonts.js'

import figlet from 'figlet'
import { renderIcon, PALETTES } from '@clarissa/core'
import type { PaletteKey } from '@clarissa/core'
import { loadIcon } from './store.js'

/**
 * Load an icon by name and render it to an ANSI string.
 *
 * @example
 * import { render } from 'hey-clarissa'
 * console.log(await render('rabbit'))
 * console.log(await render('rabbit', { palette: 'neon' }))
 */
export async function render(name: string, options?: { palette?: PaletteKey }): Promise<string> {
  const icon = await loadIcon(name)
  return renderIcon(icon, options?.palette)
}

/**
 * Render text using a figlet font, optionally colored with a palette.
 *
 * @example
 * import { render, renderText } from 'hey-clarissa'
 *
 * console.log(await render('rabbit', { palette: 'neon' }))
 * console.log(renderText('my-cli', 'Small Keyboard', { palette: 'neon' }))
 */
export function renderText(
  text: string,
  font: string = 'Small Keyboard',
  options?: { palette?: PaletteKey }
): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rendered = figlet.textSync(text, { font: font as any })
  if (!options?.palette) return rendered
  const palette = PALETTES[options.palette]
  if (palette.color === null) return rendered
  return `\x1b[38;5;${palette.color}m${rendered}\x1b[0m`
}
