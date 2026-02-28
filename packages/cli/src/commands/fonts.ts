import figlet from 'figlet'
import { PALETTES } from '@clarissa/core'
import { getActivePalette } from '../state.js'

// Curated set — good range of styles from compact to dramatic
export const FEATURED_FONTS: string[] = [
  'Small Keyboard',
  'Keyboard',
  'Small',
  'Mini',
  'Thin',
  'ANSI Compact',
  'ANSI Shadow',
  'Doom',
  'Block',
  'Banner3',
  'Larry 3D',
  'Shaded Blocky',
]

const RESET = '\x1b[0m'
const DIM = '\x1b[2m'
const BOLD = '\x1b[1m'

function applyColor(code: number | null, text: string): string {
  if (code === null) return text
  return `\x1b[38;5;${code}m${text}${RESET}`
}

function renderFont(name: string, text: string): string | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return figlet.textSync(text, { font: name as any })
  } catch {
    return null
  }
}

export async function fonts(name?: string, text?: string): Promise<void> {
  const activePalette = await getActivePalette()
  const palette = PALETTES[activePalette]

  if (name !== undefined) {
    // Preview a specific font
    const sample = text ?? 'clarissa'
    const rendered = renderFont(name, sample)
    if (rendered === null) {
      // Try case-insensitive match
      const allFonts = figlet.fontsSync()
      const match = allFonts.find(f => f.toLowerCase() === name.toLowerCase())
      if (match) {
        const r = renderFont(match, sample)!
        console.log()
        console.log(applyColor(palette.color, r))
        console.log(`\n  ${DIM}${match}${RESET}\n`)
      } else {
        throw new Error(`font not found: ${name}\n  run: clarissa fonts  to see available fonts`)
      }
      return
    }
    console.log()
    console.log(applyColor(palette.color, rendered))
    console.log(`\n  ${DIM}${name}${RESET}\n`)
    return
  }

  // List all featured fonts with previews
  const sample = text ?? 'hey'
  console.log()
  console.log(`  ${DIM}sample: "${sample}"${RESET}  ${DIM}palette: ${activePalette}${RESET}`)

  for (const fontName of FEATURED_FONTS) {
    const rendered = renderFont(fontName, sample)
    if (rendered === null) continue

    console.log()
    console.log(`  ${BOLD}${fontName}${RESET}`)
    const indented = rendered.split('\n').map(l => `  ${l}`).join('\n')
    console.log(applyColor(palette.color, indented))
  }

  console.log()
  console.log(`  ${DIM}clarissa fonts <name>              preview a font with "clarissa"${RESET}`)
  console.log(`  ${DIM}clarissa fonts <name> --text <txt>  preview with custom text${RESET}`)
  console.log()
}
