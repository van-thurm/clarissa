import * as readline from 'readline/promises'
import fs from 'fs/promises'
import path from 'path'
import { PALETTES, PALETTE_KEYS } from '@clarissa/core'
import type { PaletteKey } from '@clarissa/core'
import { getActivePalette, setActivePalette } from '../state.js'
import { ICONS_DIR, listIcons, loadIcon, saveIcon } from '../store.js'
import { fonts } from './fonts.js'
import { jam } from './jam.js'

const RESET  = '\x1b[0m'
const DIM    = '\x1b[2m'
const BOLD   = '\x1b[1m'
const ACCENT = '\x1b[38;5;216m'

function hr(): string { return `  ${ACCENT}${'━'.repeat(49)}${RESET}` }
function pal(code: number | null, s: string): string {
  return code === null ? s : `\x1b[38;5;${code}m${s}${RESET}`
}

const LETTERS   = 'abcdefghijklmnopqrstuvwxyz'
const SHELLS_FILE = path.join(process.env.HOME ?? '/tmp', '.clarissa', 'shells.sh')

function isValidName(name: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)
}

const PIXEL_CMDS = [
  ['add <file>',              'convert image, save as icon'],
  ['add <file> --size small', 'small (16px)'],
  ['add <file> --size medium','medium (32px) — default'],
  ['add <file> --size large', 'large (64px)'],
  ['preview <name>',          'print icon to terminal'],
  ['preview <name> -p neon',  'preview with a specific palette'],
  ['list',                    'all saved icons'],
  ['palette [name]',          'list or switch active palette'],
  ['dir [path]',              'set default image directory'],
] as const

async function showPixelArt(): Promise<void> {
  const activePalette = await getActivePalette()
  const palette = PALETTES[activePalette]

  console.log()
  console.log(hr())
  console.log(`  ${BOLD}pixel art${RESET}`)
  console.log(hr())
  console.log()

  const cmdWidth = Math.max(...PIXEL_CMDS.map(([c]) => ('clarissa ' + c).length))
  for (const [cmd, desc] of PIXEL_CMDS) {
    const full = `clarissa ${cmd}`
    console.log(`  ${pal(palette.color, BOLD + full.padEnd(cmdWidth) + RESET)}  ${DIM}${desc}${RESET}`)
  }

  console.log()
  console.log(`  ${DIM}run these from your terminal (not this menu).${RESET}`)
  console.log(`  ${DIM}--size accepts small · medium · large · or a pixel count${RESET}`)
  console.log()
}

// ── library (icon management) ─────────────────────────────────────────────────

async function library(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const icons = await listIcons()

  if (icons.length === 0) {
    console.log()
    console.log(`  ${DIM}no saved icons yet${RESET}`)
    console.log()
    rl.close()
    return
  }

  console.log()
  console.log(hr())
  console.log(`  ${BOLD}library${RESET}`)
  console.log(hr())
  console.log()
  for (let i = 0; i < icons.length; i++) {
    console.log(`  ${ACCENT}${LETTERS[i]}${RESET}  ${icons[i]}`)
  }
  console.log()
  console.log(`  ${DIM}(letter or name to manage, enter to go back)${RESET}`)

  const pick = (await rl.question(`  → `)).trim()
  let idx = LETTERS.indexOf(pick.toLowerCase())
  if (idx < 0 && pick) idx = icons.findIndex(n => n.toLowerCase() === pick.toLowerCase())

  if (idx < 0 || idx >= icons.length) {
    rl.close()
    return
  }

  const name = icons[idx]
  const iconData = await loadIcon(name)

  console.log()
  console.log(`  ${BOLD}${name}${RESET}  ${DIM}(${iconData.size}px)${RESET}`)
  console.log()
  console.log(`  ${ACCENT}r${RESET}  rename`)
  console.log(`  ${ACCENT}d${RESET}  delete`)
  console.log(`  ${DIM}enter  back${RESET}`)
  console.log()

  const action = (await rl.question(`  → `)).trim().toLowerCase()
  rl.close()

  if (action === 'd' || action === 'delete') {
    const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout })
    console.log()
    const confirm = (await rl2.question(`  delete ${name}? (y/n)  `)).trim().toLowerCase()
    rl2.close()
    if (confirm === 'y' || confirm === 'yes') {
      await fs.unlink(path.join(ICONS_DIR, `${name}.json`)).catch(() => {})
      await fs.unlink(path.join(ICONS_DIR, `${name}.sh`)).catch(() => {})
      console.log()
      console.log(`  ${DIM}deleted ${name}${RESET}`)
      console.log()
    }
  } else if (action === 'r' || action === 'rename') {
    const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout })
    console.log()
    const raw = (await rl2.question(`  new name:  `)).trim()
    rl2.close()
    if (!raw || !isValidName(raw)) {
      console.log(`  ${DIM}invalid name — letters, numbers, hyphens only${RESET}`)
      console.log()
      return
    }
    if (icons.includes(raw)) {
      console.log(`  ${DIM}${raw} already exists${RESET}`)
      console.log()
      return
    }
    const updated = { ...iconData, name: raw }
    await saveIcon(updated)
    await fs.unlink(path.join(ICONS_DIR, `${name}.json`)).catch(() => {})
    await fs.unlink(path.join(ICONS_DIR, `${name}.sh`)).catch(() => {})
    console.log()
    console.log(`  ${DIM}renamed to ${raw}${RESET}`)
    console.log()
  }
}

// ── jams (unified jam management) ────────────────────────────────────────────

async function listJamFunctions(): Promise<string[]> {
  try {
    const content = await fs.readFile(SHELLS_FILE, 'utf-8')
    const names: string[] = []
    for (const line of content.split('\n')) {
      const m = line.match(/^function ([a-zA-Z][a-zA-Z0-9_-]*)\(\) \{$/)
      if (m) names.push(m[1])
    }
    return names
  } catch { return [] }
}

async function deleteJamFunction(fnName: string): Promise<void> {
  const content = await fs.readFile(SHELLS_FILE, 'utf-8')
  const lines = content.split('\n')
  const startMarker = `function ${fnName}() {`
  const result: string[] = []
  let i = 0
  while (i < lines.length) {
    if (lines[i].trimEnd() === startMarker) {
      if (result.length > 0 && result[result.length - 1].trim() === '') result.pop()
      i++
      while (i < lines.length && lines[i].trimEnd() !== '}') i++
      i++
    } else {
      result.push(lines[i])
      i++
    }
  }
  await fs.writeFile(SHELLS_FILE, result.join('\n'))
}

async function renameJamFunction(oldName: string, newName: string): Promise<void> {
  const content = await fs.readFile(SHELLS_FILE, 'utf-8')
  const oldMarker = `function ${oldName}() {`
  const newMarker = `function ${newName}() {`
  await fs.writeFile(SHELLS_FILE, content.replace(oldMarker, newMarker))
}

async function jamsMenu(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const fnNames = await listJamFunctions()

  console.log()
  console.log(hr())
  console.log(`  ${BOLD}jams${RESET}`)
  console.log(hr())
  console.log()
  console.log(`  ${ACCENT}+${RESET}  ${BOLD}new jam${RESET}`)

  if (fnNames.length > 0) {
    console.log()
    for (let i = 0; i < fnNames.length; i++) {
      console.log(`  ${ACCENT}${LETTERS[i]}${RESET}  ${fnNames[i]}`)
    }
  } else {
    console.log()
    console.log(`  ${DIM}no jams yet${RESET}`)
  }

  console.log()
  console.log(`  ${DIM}(+ for new, letter to manage, enter to go back)${RESET}`)

  const pick = (await rl.question(`  → `)).trim()

  if (pick === '+' || pick.toLowerCase() === 'new') {
    rl.close()
    await jam()
    return
  }

  if (!pick) {
    rl.close()
    return
  }

  let idx = LETTERS.indexOf(pick.toLowerCase())
  if (idx < 0) idx = fnNames.findIndex(n => n.toLowerCase() === pick.toLowerCase())

  if (idx < 0 || idx >= fnNames.length) {
    rl.close()
    return
  }

  const fnName = fnNames[idx]

  console.log()
  console.log(`  ${BOLD}${fnName}${RESET}`)
  console.log()
  console.log(`  ${ACCENT}r${RESET}  rename`)
  console.log(`  ${ACCENT}d${RESET}  delete`)
  console.log(`  ${DIM}enter  back${RESET}`)
  console.log()

  const action = (await rl.question(`  → `)).trim().toLowerCase()
  rl.close()

  if (action === 'd' || action === 'delete') {
    const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout })
    console.log()
    const confirm = (await rl2.question(`  delete ${fnName}? (y/n)  `)).trim().toLowerCase()
    rl2.close()
    if (confirm === 'y' || confirm === 'yes') {
      await deleteJamFunction(fnName)
      console.log()
      console.log(`  ${DIM}deleted ${fnName}${RESET}`)
      console.log()
    }
  } else if (action === 'r' || action === 'rename') {
    const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout })
    console.log()
    const raw = (await rl2.question(`  new name:  `)).trim()
    rl2.close()
    if (!raw || !isValidName(raw)) {
      console.log(`  ${DIM}invalid name — letters, numbers, hyphens only${RESET}`)
      console.log()
      return
    }
    if (fnNames.includes(raw)) {
      console.log(`  ${DIM}${raw} already exists${RESET}`)
      console.log()
      return
    }
    await renameJamFunction(fnName, raw)
    console.log()
    console.log(`  ${DIM}renamed to ${raw}${RESET}`)
    console.log()
  }
}

// ── palette picker ───────────────────────────────────────────────────────────

async function palettePicker(): Promise<void> {
  const activePalette = await getActivePalette()

  console.log()
  console.log(hr())
  console.log(`  ${BOLD}palette${RESET}`)
  console.log(hr())
  console.log()

  const keys = PALETTE_KEYS
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const p = PALETTES[key]
    const swatch = p.color !== null
      ? `\x1b[38;5;${p.color}m${'████████'}${RESET}`
      : `${'████████'}`
    const active = key === activePalette ? `  ${ACCENT}←${RESET}` : ''
    console.log(`  ${ACCENT}${LETTERS[i]}${RESET}  ${swatch}  ${p.label}  ${DIM}${p.vibe}${RESET}${active}`)
  }

  console.log()
  console.log(`  ${DIM}(letter or name to switch, enter to go back)${RESET}`)

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const pick = (await rl.question(`  → `)).trim()
  rl.close()

  let idx = LETTERS.indexOf(pick.toLowerCase())
  if (idx < 0 && pick) idx = keys.findIndex(k => k.toLowerCase() === pick.toLowerCase())

  if (idx >= 0 && idx < keys.length) {
    const chosen = keys[idx] as PaletteKey
    await setActivePalette(chosen)
    const p = PALETTES[chosen]
    const swatch = p.color !== null
      ? `\x1b[38;5;${p.color}m${'████████'}${RESET}`
      : `${'████████'}`
    console.log()
    console.log(`  ${swatch}  switched to ${BOLD}${p.label}${RESET}`)
    console.log()
  }
}

// ── crafts menu ───────────────────────────────────────────────────────────────

export async function crafts(): Promise<void> {
  console.log()
  console.log(hr())
  console.log(`  ${BOLD}clarissa crafts${RESET}`)
  console.log(hr())
  console.log()
  console.log(`  ${ACCENT}a${RESET}  ${BOLD}pixel art${RESET}   icons, palettes, and image tools`)
  console.log(`  ${ACCENT}b${RESET}  ${BOLD}fonts${RESET}       browse and preview ASCII fonts`)
  console.log(`  ${ACCENT}c${RESET}  ${BOLD}jams${RESET}        create, rename, or delete shell commands`)
  console.log(`  ${ACCENT}d${RESET}  ${BOLD}library${RESET}     rename or delete saved icons`)
  console.log(`  ${ACCENT}e${RESET}  ${BOLD}palette${RESET}     switch your color palette`)
  console.log()
  console.log(`  ${DIM}q  back  ·  ctrl+c to cancel${RESET}`)
  console.log()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const choice = (await rl.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()
  rl.close()

  switch (choice) {
    case 'a':
    case 'pixel':
    case 'pixel art':
      await showPixelArt()
      await crafts()
      break
    case 'b':
    case 'fonts':
      await fonts()
      await crafts()
      break
    case 'c':
    case 'jam':
    case 'jams':
      await jamsMenu()
      await crafts()
      break
    case 'd':
    case 'library':
      await library()
      await crafts()
      break
    case 'e':
    case 'palette':
      await palettePicker()
      await crafts()
      break
    case 'q':
    case 'quit':
    case 'back':
      break
    default:
      if (choice) {
        const stripped = choice.replace(/^clarissa\s+/, '')
        if (['list', 'add', 'preview', 'dir'].some(c => stripped.startsWith(c))) {
          console.log()
          console.log(`  ${DIM}that's a terminal command — quit this menu first, then run:${RESET}`)
          console.log(`  ${ACCENT}clarissa ${stripped}${RESET}`)
          console.log()
        } else {
          console.log()
          console.log(`  ${DIM}not a menu option — press ${ACCENT}a${DIM}–${ACCENT}e${DIM} or ${ACCENT}q${RESET}`)
          console.log()
        }
      }
      await crafts()
  }
}
