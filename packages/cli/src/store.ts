import fs from 'fs/promises'
import path from 'path'
import type { Icon } from '@clarissa/core'

export const ICONS_DIR = path.join(process.env.HOME ?? '/tmp', '.clarissa', 'icons')

export async function ensureIconsDir(): Promise<void> {
  await fs.mkdir(ICONS_DIR, { recursive: true })
}

export async function saveIcon(icon: Icon): Promise<void> {
  await ensureIconsDir()
  await fs.writeFile(
    path.join(ICONS_DIR, `${icon.name}.json`),
    JSON.stringify(icon, null, 2)
  )
  await fs.writeFile(
    path.join(ICONS_DIR, `${icon.name}.sh`),
    toBashArray(icon)
  )
}

export async function loadIcon(name: string): Promise<Icon> {
  const file = path.join(ICONS_DIR, `${name}.json`)
  const content = await fs.readFile(file, 'utf-8').catch(() => {
    throw new Error(`icon not found: ${name}\n  run: clarissa list`)
  })
  return JSON.parse(content) as Icon
}

export async function listIcons(): Promise<string[]> {
  await ensureIconsDir()
  const files = await fs.readdir(ICONS_DIR)
  return files
    .filter(f => f.endsWith('.json'))
    .map(f => path.basename(f, '.json'))
    .sort()
}

// Generates a bash array identical in format to pixel_to_cli.py output.
// Sourceable directly: source ~/.clarissa/icons/rabbit.sh
function toBashArray(icon: Icon): string {
  const varName = `ICON_${icon.name.toUpperCase().replace(/[-. ]/g, '_')}`
  const sep = '\u2500'.repeat(Math.max(1, 44 - icon.name.length))
  const lines = [
    `# \u2500\u2500 ${varName} ${sep}`,
    `# Source : ${icon.source}`,
    `# Canvas : ${icon.size}\xd7${icon.size} logical px  \u2192  ${icon.size * 2} chars wide in terminal`,
    `# Display: printf "%s\\n" "\${${varName}[@]}"`,
    `${varName}=(`,
    ...icon.rows.map(row => `  "${row}"`),
    ')',
    '',
  ]
  return lines.join('\n')
}
