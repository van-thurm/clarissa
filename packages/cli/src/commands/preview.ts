import { renderIcon } from '@clarissa/core'
import type { PaletteKey } from '@clarissa/core'
import { loadIcon } from '../store.js'
import { getActivePalette } from '../state.js'

export async function preview(name: string, options: { palette?: PaletteKey } = {}): Promise<void> {
  const icon = await loadIcon(name)
  const paletteKey = options.palette ?? await getActivePalette()
  console.log(renderIcon(icon, paletteKey))
}
