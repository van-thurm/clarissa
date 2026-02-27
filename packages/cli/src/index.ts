// Public library API — import { render } from 'hey-clarissa'

export { renderIcon, PALETTES, DEFAULT_PALETTE, PALETTE_KEYS } from '@clarissa/core'
export type { Icon, Palette, PaletteKey } from '@clarissa/core'
export { loadIcon, listIcons, saveIcon } from './store.js'

import { renderIcon } from '@clarissa/core'
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
