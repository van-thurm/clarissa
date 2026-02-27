import { renderIcon } from '@clarissa/core'
import type { PaletteKey } from '@clarissa/core'
import { loadIcon } from '../store.js'

export async function preview(name: string, options: { palette?: PaletteKey } = {}): Promise<void> {
  const icon = await loadIcon(name)
  console.log(renderIcon(icon, options.palette))
}
