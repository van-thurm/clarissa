import path from 'path'
import sharp from 'sharp'
import { pixelsToRows, renderIcon } from '@clarissa/core'
import type { Icon } from '@clarissa/core'
import { saveIcon } from '../store.js'
import { setActiveIcon } from '../state.js'

const DEFAULT_SIZE = 32

export async function add(filePath: string, options: { size?: number; name?: string } = {}): Promise<void> {
  const size = options.size ?? DEFAULT_SIZE
  const sourceName = path.basename(filePath)
  const iconName = options.name ?? deriveIconName(filePath)

  // Load, resize (NEAREST — pixel-perfect, matches pixel_to_cli.py),
  // and composite transparency onto white — same as Python's load_image().
  const { data } = await sharp(filePath)
    .resize(size, size, { kernel: sharp.kernel.nearest, fit: 'fill' })
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
