import path from 'path'
import sharp from 'sharp'
import { pixelsToRows, renderIcon } from '@clarissa/core'
import type { Icon } from '@clarissa/core'
import { saveIcon } from '../store.js'
import { getActiveDir } from '../state.js'

const DEFAULT_SIZE = 8
export const SIZE_PRESETS: Record<string, number> = { micro: 8, small: 16 }

function resolveSize(s: string | number | undefined): number {
  if (s === undefined) return DEFAULT_SIZE
  if (typeof s === 'number') return s
  if (s in SIZE_PRESETS) return SIZE_PRESETS[s]
  const n = parseInt(s, 10)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_SIZE
}

export async function processAndSaveIcon(
  filePath: string,
  options: { size?: string | number; name?: string } = {}
): Promise<Icon> {
  const size = resolveSize(options.size)
  const resolved = await resolveFilePath(filePath)
  const sourceName = path.basename(resolved)
  const iconName = options.name ?? deriveIconName(resolved)

  const { data } = await sharp(resolved)
    .resize(size, size, { kernel: sharp.kernel.lanczos3, fit: 'contain', background: { r: 255, g: 255, b: 255 } })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .raw()
    .toBuffer({ resolveWithObject: true })

  const rows = pixelsToRows(new Uint8Array(data), size)

  const icon: Icon = {
    name: iconName,
    source: sourceName,
    size,
    rows,
    created: new Date().toISOString(),
  }

  await saveIcon(icon)
  return icon
}

export async function add(filePath: string, options: { size?: string | number; name?: string } = {}): Promise<void> {
  const icon = await processAndSaveIcon(filePath, options)

  console.log(`\n  saved  ${icon.name}`)
  console.log(`  source ${icon.source}\n`)
  console.log(renderIcon(icon))
  console.log(`\n  clarissa preview ${icon.name}\n`)
}

function deriveIconName(filePath: string): string {
  return path.basename(filePath, path.extname(filePath))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function resolveFilePath(filePath: string): Promise<string> {
  // Already absolute or relative — use as-is
  if (path.isAbsolute(filePath) || filePath.startsWith('.')) {
    return filePath
  }
  // Plain filename — try active dir first
  const activeDir = await getActiveDir()
  if (activeDir) {
    return path.join(activeDir, filePath)
  }
  // Fall back to cwd
  return path.resolve(filePath)
}
