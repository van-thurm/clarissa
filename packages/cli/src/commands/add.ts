import path from 'path'
import sharp from 'sharp'
import { pixelsToRows, renderIcon } from '@clarissa/core'
import type { Icon } from '@clarissa/core'
import { saveIcon } from '../store.js'
import { setActiveIcon, getActiveDir } from '../state.js'

const DEFAULT_SIZE = 32
const SIZE_PRESETS: Record<string, number> = { small: 16, medium: 32, large: 64 }

function resolveSize(s: string | number | undefined): number {
  if (s === undefined) return DEFAULT_SIZE
  if (typeof s === 'number') return s
  if (s in SIZE_PRESETS) return SIZE_PRESETS[s]
  const n = parseInt(s, 10)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_SIZE
}

export async function add(filePath: string, options: { size?: string | number; name?: string } = {}): Promise<void> {
  const size = resolveSize(options.size)

  // If filePath is just a filename (no directory component), resolve against active dir
  const resolved = await resolveFilePath(filePath)

  const sourceName = path.basename(resolved)
  const iconName = options.name ?? deriveIconName(resolved)

  // Load, resize (lanczos3 for quality at small sizes — nearest was blocky at 16px),
  // and composite transparency onto white.
  const { data } = await sharp(resolved)
    .resize(size, size, { kernel: sharp.kernel.lanczos3, fit: 'fill' })
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
  await setActiveIcon(iconName)

  console.log(`\n  saved  ${iconName}`)
  console.log(`  source ${sourceName}\n`)
  console.log(renderIcon(icon))
  console.log(`\n  clarissa preview ${iconName}\n`)
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
