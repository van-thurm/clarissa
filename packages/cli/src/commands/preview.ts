import { renderIcon, resizeRows } from '@clarissa/core'
import type { PaletteKey } from '@clarissa/core'
import { loadIcon } from '../store.js'
import { getActivePalette } from '../state.js'

const SIZE_PRESETS: Record<string, number> = { small: 16, medium: 32, large: 64 }

function resolveSize(s: string | number | undefined): number | undefined {
  if (s === undefined) return undefined
  if (typeof s === 'number') return s
  if (s in SIZE_PRESETS) return SIZE_PRESETS[s]
  const n = parseInt(s, 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

export async function preview(name: string, options: { palette?: PaletteKey; size?: string | number } = {}): Promise<void> {
  const icon = await loadIcon(name)
  const paletteKey = options.palette ?? await getActivePalette()
  const targetSize = resolveSize(options.size)

  const displayIcon = targetSize && icon.size > 0 && targetSize !== icon.size
    ? { ...icon, rows: resizeRows(icon.rows, icon.size, targetSize), size: targetSize }
    : icon

  console.log(renderIcon(displayIcon, paletteKey))
}
