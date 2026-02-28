import { renderIcon, PALETTES } from '@clarissa/core'
import { listIcons, loadIcon } from '../store.js'
import { getActivePalette, getActiveIcon } from '../state.js'

const RESET = '\x1b[0m'
const DIM = '\x1b[2m'
const BOLD = '\x1b[1m'

function dim(s: string): string { return `${DIM}${s}${RESET}` }
function bold(s: string): string { return `${BOLD}${s}${RESET}` }
function color(code: number | null, s: string): string {
  if (code === null) return s
  return `\x1b[38;5;${code}m${s}${RESET}`
}

const COMMANDS = [
  { cmd: 'clarissa add <file.png>',          desc: 'convert pixel art, save as icon'     },
  { cmd: 'clarissa preview <name>',          desc: 'print icon to terminal'               },
  { cmd: 'clarissa list',                    desc: 'show all saved icons'                 },
  { cmd: 'clarissa palette [name]',          desc: 'switch color palette'                 },
]

export async function welcome(): Promise<void> {
  const [icons, activePalette, activeIconName] = await Promise.all([
    listIcons(),
    getActivePalette(),
    getActiveIcon(),
  ])

  const palette = PALETTES[activePalette]

  // Show icon if we have one — prefer active, fall back to first
  const iconName = activeIconName && icons.includes(activeIconName)
    ? activeIconName
    : icons[0]

  if (iconName) {
    const icon = await loadIcon(iconName)
    console.log()
    console.log(renderIcon(icon, activePalette)
      .split('\n')
      .map(line => `  ${line}`)
      .join('\n'))
  } else {
    console.log()
  }

  // Palette indicator
  const swatch = palette.color !== null
    ? color(palette.color, '██')
    : '██'
  console.log()
  console.log(`  ${swatch}  ${dim(palette.name)}`)
  console.log()

  // Command list
  const cmdWidth = Math.max(...COMMANDS.map(c => c.cmd.length))
  for (const { cmd, desc } of COMMANDS) {
    console.log(`  ${bold(cmd.padEnd(cmdWidth))}  ${dim(desc)}`)
  }

  console.log()

  if (icons.length === 0) {
    console.log(`  ${dim('no icons yet — drop in a PNG to get started')}`)
    console.log()
  }
}
