import * as readline from 'readline/promises'
import fs from 'fs/promises'
import path from 'path'
import { execSync } from 'child_process'
import figlet from 'figlet'
import { PALETTES, PALETTE_KEYS, renderIcon } from '@clarissa/core'
import type { PaletteKey } from '@clarissa/core'
import { getActivePalette, setActivePalette } from '../state.js'
import { SHELLS_FILE, isValidName } from '../paths.js'
import { ICONS_DIR, listIcons, loadIcon, saveIcon } from '../store.js'
import { processAndSaveIcon } from './add.js'
import { useArt, useFont, manageArt } from './use-art.js'
import { preview } from './preview.js'
import { fonts, FONT_CATEGORIES } from './fonts.js'
import { jam } from './jam.js'
import { loadTheme, reloadTheme, RESET, BOLD } from '../theme.js'

let DIM = '', ACCENT = ''

function hr(): string { return `  ${ACCENT}${'━'.repeat(49)}${RESET}` }
function nav(): void { console.log(`  ${DIM}q  back${RESET}`) }

const LETTERS   = 'abcdefghijklmnopqrstuvwxyz'

function label(i: number): string {
  if (i < 26) return LETTERS[i]
  return LETTERS[Math.floor(i / 26) - 1] + LETTERS[i % 26]
}

function labelIndex(pick: string): number {
  if (pick.length === 1) return LETTERS.indexOf(pick)
  if (pick.length === 2) {
    const hi = LETTERS.indexOf(pick[0])
    const lo = LETTERS.indexOf(pick[1])
    if (hi >= 0 && lo >= 0) return (hi + 1) * 26 + lo
  }
  return -1
}
const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'])

// ── file picker (macOS) ──────────────────────────────────────────────────────

function openFilePicker(): string | null {
  if (process.platform !== 'darwin') {
    console.log()
    console.log(`  ${DIM}file picker is only available on macOS${RESET}`)
    console.log(`  ${DIM}use "type a file path" instead${RESET}`)
    console.log()
    return null
  }
  try {
    const result = execSync(
      `osascript -e 'POSIX path of (choose file of type {"public.image"} with prompt "Select an image")'`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    )
    return result.trim()
  } catch {
    return null
  }
}

// ── add art flow ─────────────────────────────────────────────────────────────

async function addArtFlow(): Promise<void> {
  while (true) {
    console.log()
    console.log(hr())
    console.log(`  ${BOLD}add art${RESET}`)
    console.log(hr())
    console.log()
    console.log(`  ${ACCENT}a${RESET}  type a file path`)
    console.log(`  ${ACCENT}b${RESET}  choose file...`)
    console.log()
    nav()
    console.log()

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const pick = (await rl.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()
    rl.close()

    if (pick === 'q' || pick === 'back') return

    let filePath: string | null = null

    if (pick === 'a') {
      const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout })
      console.log()
      console.log(`  ${DIM}enter the full path to an image file${RESET}`)
      console.log(`  ${DIM}tip: drag a file from Finder into this window to paste its path${RESET}`)
      console.log()
      const typed = (await rl2.question(`  path:  `)).trim()
      rl2.close()

      if (!typed || typed === 'q') continue

      const ext = path.extname(typed).toLowerCase()
      if (!IMAGE_EXTS.has(ext)) {
        console.log()
        console.log(`  ${ACCENT}unsupported file type${RESET} ${DIM}— use png, jpg, gif, webp, or svg${RESET}`)
        continue
      }
      try {
        await fs.access(typed)
      } catch {
        console.log()
        console.log(`  ${ACCENT}file not found${RESET} ${DIM}— check the path and try again${RESET}`)
        continue
      }
      filePath = typed

    } else if (pick === 'b') {
      filePath = openFilePicker()
      if (!filePath) continue
    } else {
      continue
    }

    const size = await pickSize()
    if (size === null) continue

    try {
      const icon = await processAndSaveIcon(filePath, { size })
      await useArt(icon)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log()
      console.log(`  ${ACCENT}couldn't process this image${RESET} ${DIM}— ${msg}${RESET}`)
    }
  }
}

async function pickSize(): Promise<number | null> {
  console.log()
  console.log(hr())
  console.log(`  ${BOLD}upload size${RESET}`)
  console.log(hr())
  console.log()
  console.log(`  ${ACCENT}a${RESET}  micro (8px)    ${DIM}← default${RESET}`)
  console.log(`  ${ACCENT}b${RESET}  small (16px)`)
  console.log()
  nav()
  console.log()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const pick = (await rl.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()
  rl.close()

  if (pick === 'q' || pick === 'back') return null
  if (pick === 'b' || pick === 'small') return 16
  return 8
}

// ── gallery browser ──────────────────────────────────────────────────────────

async function browseGallery(): Promise<void> {
  const icons = await listIcons()
  if (icons.length === 0) {
    console.log()
    console.log(`  ${DIM}no art yet${RESET}`)
    console.log()
    return
  }

  const palette = await getActivePalette()
  let cursor = 0

  const showCurrent = async () => {
    const name = icons[cursor]
    const icon = await loadIcon(name)
    console.log()
    console.log(hr())
    console.log(`  ${BOLD}${name}${RESET}  ${DIM}(${cursor + 1}/${icons.length})${RESET}`)
    console.log(hr())
    console.log()
    console.log(renderIcon(icon, palette).split('\n').map(l => `  ${l}`).join('\n'))
    console.log()
    console.log(`  ${ACCENT}←${RESET} ${DIM}prev${RESET}  ${ACCENT}→${RESET} ${DIM}next${RESET}  ${ACCENT}enter${RESET} ${DIM}use this${RESET}  ${ACCENT}q${RESET} ${DIM}back${RESET}`)
    console.log()
  }

  await showCurrent()

  return new Promise<void>((resolve) => {
    const stdin = process.stdin
    const wasRaw = stdin.isRaw
    stdin.setRawMode(true)
    stdin.resume()

    const onData = async (buf: Buffer) => {
      const key = buf.toString()

      if (key === 'q' || key === '\x03') {
        cleanup()
        resolve()
        return
      }

      // Arrow keys: ESC [ A/B/C/D
      if (key === '\x1b[C' || key === 'l') {
        cursor = (cursor + 1) % icons.length
        await showCurrent()
        return
      }
      if (key === '\x1b[D' || key === 'h') {
        cursor = (cursor - 1 + icons.length) % icons.length
        await showCurrent()
        return
      }

      // Enter — use this art
      if (key === '\r' || key === '\n') {
        cleanup()
        const icon = await loadIcon(icons[cursor])
        await useArt(icon)
        resolve()
        return
      }
    }

    const cleanup = () => {
      stdin.removeListener('data', onData)
      stdin.setRawMode(wasRaw ?? false)
      stdin.pause()
    }

    stdin.on('data', onData)
  })
}

// ── preview picker ───────────────────────────────────────────────────────────

async function previewPicker(): Promise<void> {
  const icons = await listIcons()

  console.log()
  console.log(hr())
  console.log(`  ${BOLD}preview art${RESET}`)
  console.log(hr())
  console.log()

  if (icons.length === 0) {
    console.log(`  ${DIM}no art yet${RESET}`)
    console.log()
    return
  }

  for (let i = 0; i < icons.length; i++) {
    console.log(`  ${ACCENT}${label(i)}${RESET}  ${icons[i]}`)
  }
  console.log()
  nav()
  console.log()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const pick = (await rl.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()
  rl.close()

  if (pick === 'q' || pick === 'back' || !pick) return

  let idx = labelIndex(pick)
  if (idx < 0 || idx >= icons.length) idx = icons.findIndex(n => n.toLowerCase() === pick)

  if (idx >= 0 && idx < icons.length) {
    const icon = await loadIcon(icons[idx])
    await useArt(icon)
  }
}

// ── fonts browser ────────────────────────────────────────────────────────────

async function browseFonts(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  console.log()
  const customText = (await rl.question(`  ${DIM}text to preview (enter for "hey"):${RESET}  `)).trim()
  rl.close()

  const sample = customText || 'hey'

  const palette = PALETTES[await getActivePalette()]
  const colorCode = palette.fill

  const rendered: Array<{ font: string; rows: string[] }> = []

  console.log()
  console.log(`  ${DIM}sample: "${sample}"${RESET}`)

  for (const [category, categoryFonts] of Object.entries(FONT_CATEGORIES)) {
    let categoryPrinted = false
    for (const fontName of categoryFonts) {
      let raw: string
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        raw = figlet.textSync(sample, { font: fontName as any })
      } catch { continue }
      const rows = raw.split('\n')
      if (!rows.some(r => r.trim())) continue

      if (!categoryPrinted) {
        console.log()
        console.log(`  ${DIM}── ${category}${RESET}`)
        categoryPrinted = true
      }

      const num = String(rendered.length + 1).padStart(3)
      console.log()
      console.log(`  ${ACCENT}${num}${RESET}  ${DIM}${fontName}${RESET}`)
      for (const row of rows) {
        const colored = colorCode !== null ? `\x1b[38;5;${colorCode}m${row}${RESET}` : row
        console.log(`  ${colored}`)
      }
      rendered.push({ font: fontName, rows })
    }
  }

  if (rendered.length === 0) {
    console.log(`  ${DIM}no fonts rendered for that text${RESET}`)
    console.log()
    return
  }

  console.log()
  console.log(hr())
  console.log(`  ${DIM}pick a font by number to use it, or q to go back${RESET}`)
  console.log()

  const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout })
  const pick = (await rl2.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()
  rl2.close()

  if (pick === 'q' || pick === 'back' || !pick) return

  const idx = parseInt(pick, 10) - 1
  if (isNaN(idx) || idx < 0 || idx >= rendered.length) return

  const chosen = rendered[idx]
  console.log()
  for (const row of chosen.rows) {
    const colored = colorCode !== null ? `\x1b[38;5;${colorCode}m${row}${RESET}` : row
    console.log(`  ${colored}`)
  }

  await useFont(chosen.font, sample, chosen.rows)
}

// ── art menu ─────────────────────────────────────────────────────────────────

async function showArt(): Promise<void> {
  while (true) {
    console.log()
    console.log(hr())
    console.log(`  ${BOLD}art${RESET}`)
    console.log(hr())
    console.log()
    console.log(`  ${ACCENT}a${RESET}  ${BOLD}browse gallery${RESET}     ${DIM}arrow keys to flip through${RESET}`)
    console.log(`  ${ACCENT}b${RESET}  ${BOLD}add art${RESET}            ${DIM}convert an image${RESET}`)
    console.log(`  ${ACCENT}c${RESET}  ${BOLD}preview art${RESET}        ${DIM}pick from your collection${RESET}`)
    console.log(`  ${ACCENT}d${RESET}  ${BOLD}list saved art${RESET}`)
    console.log(`  ${ACCENT}e${RESET}  ${BOLD}manage${RESET}             ${DIM}remove welcome art, startup art, etc.${RESET}`)
    console.log()
    nav()
    console.log()

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const pick = (await rl.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()
    rl.close()

    switch (pick) {
      case 'a':
      case 'gallery':
      case 'browse':
        await browseGallery()
        break
      case 'b':
      case 'add':
        await addArtFlow()
        break
      case 'c':
      case 'preview':
        await previewPicker()
        break
      case 'd':
      case 'list': {
        const icons = await listIcons()
        console.log()
        if (icons.length === 0) {
          console.log(`  ${DIM}no art yet${RESET}`)
        } else {
          for (const name of icons) console.log(`  ${name}`)
        }
        console.log()
        break
      }
      case 'e':
      case 'manage':
        await manageArt()
        break
      case 'q':
      case 'quit':
      case 'back':
        return
      default:
        if (pick) {
          console.log()
          console.log(`  ${DIM}press ${ACCENT}a${DIM}–${ACCENT}e${DIM} or ${ACCENT}q${RESET}`)
          console.log()
        }
    }
  }
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
    console.log(`  ${ACCENT}${label(i)}${RESET}  ${icons[i]}`)
  }
  console.log()
  console.log(`  ${DIM}(letter or name to manage, enter to go back)${RESET}`)

  const pick = (await rl.question(`  → `)).trim()
  let idx = labelIndex(pick.toLowerCase())
  if ((idx < 0 || idx >= icons.length) && pick) idx = icons.findIndex(n => n.toLowerCase() === pick.toLowerCase())

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
      console.log(`  ${ACCENT}${label(i)}${RESET}  ${fnNames[i]}`)
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

  let idx = labelIndex(pick.toLowerCase())
  if ((idx < 0 || idx >= fnNames.length)) idx = fnNames.findIndex(n => n.toLowerCase() === pick.toLowerCase())

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
    const swatch = paletteSwatch(p)
    const active = key === activePalette ? `  ${ACCENT}←${RESET}` : ''
    console.log(`  ${ACCENT}${label(i)}${RESET}  ${swatch}  ${p.label}  ${DIM}${p.vibe}${RESET}${active}`)
  }

  console.log()
  console.log(`  ${DIM}(letter or name to switch, enter to go back)${RESET}`)

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const pick = (await rl.question(`  → `)).trim()
  rl.close()

  let idx = labelIndex(pick.toLowerCase())
  if ((idx < 0 || idx >= keys.length) && pick) idx = keys.findIndex(k => k.toLowerCase() === pick.toLowerCase())

  if (idx >= 0 && idx < keys.length) {
    const chosen = keys[idx] as PaletteKey
    await setActivePalette(chosen)
    reloadTheme(chosen)
    const t = await loadTheme(); ACCENT = t.ACCENT; DIM = t.DIM
    const p = PALETTES[chosen]
    console.log()
    console.log(`  ${paletteSwatch(p)}  switched to ${BOLD}${p.label}${RESET}`)
    console.log()
  }
}

function paletteSwatch(p: { fill: number | null; accent: number; dim: number }): string {
  const blk = '███'
  const f = p.fill !== null ? `\x1b[38;5;${p.fill}m${blk}${RESET}` : blk
  const a = `\x1b[38;5;${p.accent}m${blk}${RESET}`
  const d = `\x1b[38;5;${p.dim}m${blk}${RESET}`
  return `${f}${a}${d}`
}

// ── crafts menu ───────────────────────────────────────────────────────────────

export async function crafts(): Promise<void> {
  const t = await loadTheme(); ACCENT = t.ACCENT; DIM = t.DIM
  console.log()
  console.log(hr())
  console.log(`  ${BOLD}clarissa crafts${RESET}`)
  console.log(hr())
  console.log()
  console.log(`  ${ACCENT}a${RESET}  ${BOLD}art${RESET}         browse, create, and use art`)
  console.log(`  ${ACCENT}b${RESET}  ${BOLD}fonts${RESET}       browse and preview ASCII fonts`)
  console.log(`  ${ACCENT}c${RESET}  ${BOLD}jams${RESET}        create, rename, or delete shell commands`)
  console.log(`  ${ACCENT}d${RESET}  ${BOLD}library${RESET}     rename or delete saved icons`)
  console.log(`  ${ACCENT}e${RESET}  ${BOLD}palette${RESET}     switch your color palette`)
  console.log()
  console.log(`  ${DIM}q  back${RESET}`)
  console.log()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const choice = (await rl.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()
  rl.close()

  switch (choice) {
    case 'a':
    case 'art':
      await showArt()
      await crafts()
      break
    case 'b':
    case 'fonts':
      await browseFonts()
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
