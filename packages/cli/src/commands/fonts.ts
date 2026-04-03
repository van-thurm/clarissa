import figlet from 'figlet'
import { PALETTES } from '@clarissa/core'
import { getActivePalette } from '../state.js'

// Fonts organized by use case. One category per font — most useful placement for jam.
export const FONT_CATEGORIES: Record<string, string[]> = {
  HEADER: [
    'ANSI Shadow', 'Big', 'Big Money-ne', 'Big Money-nw', 'Big Money-se', 'Big Money-sw',
    'Bloody', 'Broadway', 'Chunky', 'Cyberlarge', 'DOS Rebel', 'Double',
    'Larry 3D', 'Rammstein', 'Slant Relief', 'Stronger Than All', 'Sub-Zero',
    'Blocks', 'Banner', 'Banner3',
  ],
  STATEMENT: [
    'ANSI Compact', 'ANSI Regular', 'Doom', 'Lean', 'Pagga', 'Shaded Blocky',
    'Speed', 'Stellar', 'The Edge', 'Twisted', 'Wavescape', 'Shadow', 'Script', 'Swamp Land',
  ],
  COMPACT: [
    'Cricket', 'Coder Mini', 'Cybersmall', 'Cybermedium', 'Double Shorts', 'Elite',
    'JS Stick Letters', 'Keyboard', 'Linux', 'Lockergnome', 'Marquee',
    'Mono 12', 'Mono 9', 'Small', 'Small Keyboard', 'Small Mono 12', 'Small Mono 9',
    'Small Slant', 'Small Block', 'Standard', 'Terrace', 'Thin', 'Three Point',
    'WideTerm', 'Soft', 'Small Braille', 'Univers',
  ],
  GEOMETRIC: [
    'Calvin S', 'Future', 'Isometric1', 'Isometric2', 'Isometric3', 'Isometric4',
    'Small Isometric1', 'JS Block Letters', 'Line Blocks', 'Modular', 'Rectangles',
    'Tiles', 'Tmplr', 'Big Mono 12', 'Big Mono 9', 'DiamFont',
  ],
  'TECH / RETRO': [
    'Digital', 'Electronic', 'Morse',
  ],
  'NOVELTY / CHARACTER': [
    'Alphabet', 'AMC Slider', 'Babyface Lame', 'Babyface Leet', 'BlurVision ASCII',
    'Bubble', 'Circle', 'Crawford', 'Crawford2', 'Dr Pepper', 'Emboss',
    'Impossible', 'Merlin1', 'Nancyj-Improved', 'Nancyj-Underlined', 'Old Banner',
    'Poison', 'Roman', 'RubiFont', 'S Blood', 'Spliff', 'Stampate', 'Stampatello',
    'THIS', 'Train', 'Upside Down Text', 'USA Flag', 'Weird', 'miniwi',
  ],
}

// Flat list derived from categories — preserves category order
export const FEATURED_FONTS: string[] = Object.values(FONT_CATEGORIES).flat()

import { loadTheme, RESET, BOLD } from '../theme.js'

let DIM = ''

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

function scaleText(rendered: string, factor: number): string {
  if (factor <= 1) return rendered
  return rendered
    .split('\n')
    .flatMap(line => {
      const scaled = line.split('').map(ch => ch.repeat(factor)).join('')
      return Array(factor).fill(scaled)
    })
    .join('\n')
}

export async function fonts(name?: string, text?: string, all?: boolean, scale?: number): Promise<void> {
  const t = await loadTheme(); DIM = t.DIM
  const activePalette = await getActivePalette()
  const palette = PALETTES[activePalette]
  const scaleFactor = scale && scale > 1 ? Math.round(scale) : 1

  if (all) {
    const allFonts = figlet.fontsSync().sort()
    const sample = text ?? 'hey'
    let renderedCount = 0
    console.log()
    console.log(`  ${DIM}${allFonts.length} fonts available  ·  sample: "${sample}"  ·  palette: ${activePalette}${RESET}`)

    for (const fontName of allFonts) {
      const raw = renderFont(fontName, sample)
      if (raw === null) continue
      renderedCount++
      const rendered = scaleText(raw, scaleFactor)
      console.log()
      console.log(`  ${BOLD}${fontName}${RESET}`)
      const indented = rendered.split('\n').map(l => `  ${l}`).join('\n')
      console.log(applyColor(palette.fill, indented))
    }

    const skipped = allFonts.length - renderedCount
    console.log()
    const footer = skipped > 0
      ? `${renderedCount} of ${allFonts.length} fonts  ·  clarissa fonts <name> --text <txt> to preview one`
      : `${renderedCount} fonts  ·  clarissa fonts <name> --text <txt> to preview one`
    console.log(`  ${DIM}${footer}${RESET}`)
    console.log()
    return
  }

  if (name !== undefined) {
    // Preview a specific font
    const sample = text ?? 'clarissa'
    const raw = renderFont(name, sample)
    if (raw === null) {
      // Try case-insensitive match
      const allFonts = figlet.fontsSync()
      const match = allFonts.find(f => f.toLowerCase() === name.toLowerCase())
      if (match) {
        const r = scaleText(renderFont(match, sample)!, scaleFactor)
        console.log()
        console.log(applyColor(palette.fill, r))
        console.log(`\n  ${DIM}${match}${scaleFactor > 1 ? `  ·  scale ${scaleFactor}x` : ''}${RESET}\n`)
      } else {
        throw new Error(`font not found: ${name}\n  run: clarissa fonts  to see available fonts`)
      }
      return
    }
    const rendered = scaleText(raw, scaleFactor)
    console.log()
    console.log(applyColor(palette.fill, rendered))
    console.log(`\n  ${DIM}${name}${scaleFactor > 1 ? `  ·  scale ${scaleFactor}x` : ''}${RESET}\n`)
    return
  }

  // List all featured fonts with previews, grouped by category
  const sample = text ?? 'hey'
  console.log()
  console.log(`  ${DIM}sample: "${sample}"${RESET}  ${DIM}palette: ${activePalette}${RESET}`)

  for (const [category, categoryFonts] of Object.entries(FONT_CATEGORIES)) {
    let categoryPrinted = false

    for (const fontName of categoryFonts) {
      const raw = renderFont(fontName, sample)
      if (raw === null) continue

      if (!categoryPrinted) {
        console.log()
        console.log(`  ${DIM}── ${category}${RESET}`)
        categoryPrinted = true
      }

      const rendered = scaleText(raw, scaleFactor)
      console.log()
      console.log(`  ${BOLD}${fontName}${RESET}`)
      const indented = rendered.split('\n').map(l => `  ${l}`).join('\n')
      console.log(applyColor(palette.fill, indented))
    }
  }

  console.log()
  console.log(`  ${DIM}clarissa fonts <name>              preview a font with "clarissa"${RESET}`)
  console.log(`  ${DIM}clarissa fonts <name> --text <txt>  preview with custom text${RESET}`)
  console.log(`  ${DIM}clarissa fonts <name> --scale 2     scale up block fonts${RESET}`)
  console.log()
}
