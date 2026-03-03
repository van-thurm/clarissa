import figlet from 'figlet'
import * as readline from 'readline/promises'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { FONT_CATEGORIES } from './fonts.js'
import { resizeRows } from '@clarissa/core'
import { loadIcon } from '../store.js'

const RESET  = '\x1b[0m'
const DIM    = '\x1b[2m'
const BOLD   = '\x1b[1m'
const ACCENT = '\x1b[38;5;216m'

function hr(): string { return `  ${ACCENT}${'━'.repeat(49)}${RESET}` }

const HOME         = os.homedir()
const CLARISSA_DIR = path.join(HOME, '.clarissa')
const SHELLS_FILE  = path.join(CLARISSA_DIR, 'shells.sh')
const ICONS_DIR    = path.join(CLARISSA_DIR, 'icons')
const ZSHRC        = path.join(HOME, '.zshrc')

const LETTERS = 'abcdefghijklmnopqrstuvwxyz' // used for icon list only (short lists)

// ── file helpers ──────────────────────────────────────────────────────────────

function isValidName(name: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)
}

async function ensureShellsFile(): Promise<void> {
  await fs.mkdir(CLARISSA_DIR, { recursive: true })
  try { await fs.access(SHELLS_FILE) }
  catch { await fs.writeFile(SHELLS_FILE, '# clarissa jam — custom shell commands\n\n') }
}

// Returns true if we added the source line (first time only)
async function ensureZshrcSourced(): Promise<boolean> {
  const mark = 'source ~/.clarissa/shells.sh'
  let content = ''
  try { content = await fs.readFile(ZSHRC, 'utf-8') } catch { /* no .zshrc yet */ }
  if (content.includes(mark)) return false
  await fs.appendFile(ZSHRC, `\n# clarissa\n${mark}\n`)
  return true
}

async function listIcons(): Promise<string[]> {
  try {
    const files = await fs.readdir(ICONS_DIR)
    return files.filter(f => f.endsWith('.sh')).map(f => f.replace('.sh', '')).sort()
  } catch { return [] }
}

async function readIconRows(name: string): Promise<string[]> {
  const content = await fs.readFile(path.join(ICONS_DIR, `${name}.sh`), 'utf-8')
  const rows: string[] = []
  let inArray = false
  for (const line of content.split('\n')) {
    if (line.includes('=(')) { inArray = true; continue }
    if (inArray && line.trim() === ')') break
    if (inArray) {
      const m = line.match(/^\s+"(.*)"/)
      if (m) rows.push(m[1])
    }
  }
  return rows
}

function renderFontRows(font: string, text: string): string[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return figlet.textSync(text, { font: font as any }).split('\n')
  } catch { return [] }
}

// ── shell function generation ─────────────────────────────────────────────────

// Escape content for use inside bash double-quoted strings
function bashEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$')
}

function buildFunction(
  name: string,
  cmd: string | null,
  fontRows: string[] | null,
  iconRows: string[] | null,
  layout: 'above' | 'left' | 'right' = 'above',
): string {
  const lines: string[] = [`function ${name}() {`]

  if (layout !== 'above' && iconRows && iconRows.length > 0 && fontRows && fontRows.length > 0) {
    // Side-by-side: icon left = _left plain, font right = _right accent (and vice versa for 'right')
    const leftRows  = layout === 'left' ? iconRows : fontRows
    const rightRows = layout === 'left' ? fontRows  : iconRows
    const lw = Math.max(...leftRows.map(r => r.length))
    lines.push('  local _left=(')
    for (const row of leftRows) lines.push(`    "${bashEscape(row)}"`)
    lines.push('  )')
    lines.push('  local _right=(')
    for (const row of rightRows) lines.push(`    "${bashEscape(row)}"`)
    lines.push('  )')
    lines.push(`  local _lw=${lw}`)
    lines.push('  local _i=0')
    lines.push('  local _n=$(( ${#_left[@]} > ${#_right[@]} ? ${#_left[@]} : ${#_right[@]} ))')
    lines.push('  while [[ $_i -lt $_n ]]; do')
    if (layout === 'left') {
      // icon left (no color), font right (accent)
      lines.push('    printf "%-${_lw}s   \\033[38;5;216m%s\\033[0m\\n" "${_left[$_i]:-}" "${_right[$_i]:-}"')
    } else {
      // font left (accent), icon right (no color)
      lines.push('    printf "\\033[38;5;216m%-${_lw}s\\033[0m   %s\\n" "${_left[$_i]:-}" "${_right[$_i]:-}"')
    }
    lines.push('    ((_i++))')
    lines.push('  done')
  } else {
    // Stacked layout
    if (iconRows && iconRows.length > 0) {
      lines.push('  local _icon=(')
      for (const row of iconRows) lines.push(`    "${bashEscape(row)}"`)
      lines.push('  )')
      lines.push("  printf '%s\\n' \"${_icon[@]}\"")
    }
    if (fontRows && fontRows.length > 0) {
      lines.push('  local _header=(')
      for (const row of fontRows) lines.push(`    "${bashEscape(row)}"`)
      lines.push('  )')
      lines.push("  printf '\\033[38;5;216m'; printf '%s\\n' \"${_header[@]}\"; printf '\\033[0m'")
    }
  }

  // Command — runs exactly as typed, no arg passthrough (safe for cd, git, etc.)
  if (cmd) lines.push(`  ${cmd}`)

  lines.push('}')
  return lines.join('\n')
}

// ── main ──────────────────────────────────────────────────────────────────────

export async function jam(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  console.log()
  console.log(hr())
  console.log(`  ${BOLD}clarissa jam${RESET}`)
  console.log(`  ${DIM}make a new shell command${RESET}`)
  console.log(hr())
  console.log()
  console.log(`  ${DIM}ctrl+c to cancel${RESET}`)
  console.log()

  // ── name ──────────────────────────────────────────────────────────────────

  let name = ''
  while (!name) {
    const raw = (await rl.question(`  what should it be called?  `)).trim()
    if (!raw) continue
    if (!isValidName(raw)) {
      console.log(`  ${DIM}letters, numbers, hyphens only — no spaces${RESET}`)
      continue
    }
    name = raw
  }

  console.log()

  // ── mode ──────────────────────────────────────────────────────────────────

  console.log(`  what should ${BOLD}${name}${RESET} do?`)
  console.log()
  console.log(`  ${ACCENT}a${RESET}  print something    build a display with fonts + icons`)
  console.log(`  ${ACCENT}b${RESET}  run a command      wrap any shell command with visual style`)
  console.log()

  let mode: 'print' | 'wrap' = 'print'
  while (true) {
    const pick = (await rl.question(`  → `)).trim().toLowerCase()
    if (pick === 'a') { mode = 'print'; break }
    if (pick === 'b') { mode = 'wrap'; break }
  }

  // ── command (wrap only) ───────────────────────────────────────────────────

  let cmd: string | null = null
  if (mode === 'wrap') {
    console.log()
    while (!cmd) {
      const raw = (await rl.question(`  what command should ${name} run?  `)).trim()
      if (raw) cmd = raw
    }
  }

  console.log()
  console.log(hr())
  console.log()

  // ── font header ───────────────────────────────────────────────────────────

  console.log(`  add a header?  ${DIM}what should it say? (enter to skip)${RESET}`)
  const headerText = (await rl.question(`  → `)).trim()
  console.log()

  let fontRows: string[] | null = null
  if (headerText) {
    // Render all featured fonts with the user's text, grouped by category
    const rendered: Array<{ font: string; rows: string[] }> = []

    for (const [category, categoryFonts] of Object.entries(FONT_CATEGORIES)) {
      let categoryPrinted = false
      for (const font of categoryFonts) {
        const rows = renderFontRows(font, headerText)
        if (rows.length === 0 || !rows.some(r => r.trim())) continue

        if (!categoryPrinted) {
          console.log(`  ${DIM}── ${category}${RESET}`)
          console.log()
          categoryPrinted = true
        }

        const num = String(rendered.length + 1).padStart(2)
        console.log(`  ${ACCENT}${num}${RESET}  ${DIM}${font}${RESET}`)
        for (const row of rows) console.log(`  ${ACCENT}${row}${RESET}`)
        console.log()
        rendered.push({ font, rows })
      }
    }

    console.log(`  pick a font:  ${DIM}(number or name, or enter to skip)${RESET}`)
    const pick = (await rl.question(`  → `)).trim()
    let fontIdx = parseInt(pick, 10) - 1
    if (isNaN(fontIdx) && pick) fontIdx = rendered.findIndex(r => r.font.toLowerCase() === pick.toLowerCase())
    if (fontIdx >= 0 && fontIdx < rendered.length) fontRows = rendered[fontIdx].rows
    console.log()
  }

  // ── icon ──────────────────────────────────────────────────────────────────

  const icons = await listIcons()
  let iconRows: string[] | null = null

  if (icons.length === 0) {
    console.log(`  ${DIM}no saved icons yet — make some in clarissa crafts${RESET}`)
    console.log()
  } else {
    console.log(`  add an icon?`)
    console.log()
    for (let i = 0; i < icons.length; i++) {
      console.log(`  ${ACCENT}${LETTERS[i]}${RESET}  ${icons[i]}`)
    }
    console.log()
    console.log(`  ${DIM}(letter, name, or enter to skip)${RESET}`)
    const pick = (await rl.question(`  → `)).trim()
    let iconIdx = LETTERS.indexOf(pick.toLowerCase())
    if (iconIdx < 0 && pick) iconIdx = icons.findIndex(n => n.toLowerCase() === pick.toLowerCase())
    if (iconIdx >= 0 && iconIdx < icons.length) {
      const selectedIcon = await loadIcon(icons[iconIdx])
      iconRows = selectedIcon.rows
      const storedSize = selectedIcon.size
      console.log()
      console.log(`  resize?  ${DIM}s=16  m=32  l=64  (enter to keep ${storedSize}px)${RESET}`)
      const sizePick = (await rl.question(`  → `)).trim().toLowerCase()
      const sizeMap: Record<string, number> = { s: 16, m: 32, l: 64 }
      const targetSize = sizeMap[sizePick] ?? storedSize
      if (targetSize !== storedSize) iconRows = resizeRows(iconRows, storedSize, targetSize)
    }
    console.log()
  }

  // ── layout (only if both font + icon) ─────────────────────────────────────

  let layout: 'above' | 'left' | 'right' = 'above'
  if (fontRows && iconRows) {
    console.log(hr())
    console.log()
    console.log(`  layout?`)
    console.log()
    console.log(`  ${ACCENT}l${RESET}  icon left, font right`)
    console.log(`  ${ACCENT}r${RESET}  font left, icon right`)
    console.log(`  ${DIM}enter  icon above font${RESET}`)
    console.log()
    const lp = (await rl.question(`  → `)).trim().toLowerCase()
    if (lp === 'l') layout = 'left'
    else if (lp === 'r') layout = 'right'
    console.log()
  }

  rl.close()

  // ── save ──────────────────────────────────────────────────────────────────

  await ensureShellsFile()
  const fn = buildFunction(name, cmd, fontRows, iconRows, layout)
  await fs.appendFile(SHELLS_FILE, `\n${fn}\n`)
  const patched = await ensureZshrcSourced()

  // ── preview ───────────────────────────────────────────────────────────────

  console.log(hr())
  console.log(`  ${DIM}preview${RESET}`)
  console.log()

  if (layout !== 'above' && iconRows && fontRows) {
    const leftRows  = layout === 'left' ? iconRows : fontRows
    const rightRows = layout === 'left' ? fontRows  : iconRows
    const lw = Math.max(...leftRows.map(r => r.length))
    const n = Math.max(leftRows.length, rightRows.length)
    for (let i = 0; i < n; i++) {
      const l = (leftRows[i] ?? '').padEnd(lw)
      const r = rightRows[i] ?? ''
      if (layout === 'left') console.log(`${l}   ${ACCENT}${r}${RESET}`)
      else                   console.log(`${ACCENT}${l}${RESET}   ${r}`)
    }
    console.log()
  } else {
    if (iconRows && iconRows.length > 0) {
      for (const row of iconRows) console.log(row)
      console.log()
    }
    if (fontRows && fontRows.length > 0) {
      for (const row of fontRows) console.log(`  ${ACCENT}${row}${RESET}`)
      console.log()
    }
  }

  if (cmd) {
    console.log(`  ${DIM}then runs:${RESET}  ${cmd}`)
    console.log()
  }

  if (!iconRows && !fontRows && !cmd) {
    console.log(`  ${DIM}(empty command — nothing to preview)${RESET}`)
    console.log()
  }

  console.log(hr())
  console.log()
  console.log(`  function ${ACCENT}${name}${RESET} saved.`)
  console.log()

  if (patched) {
    console.log(`  ${DIM}added shells.sh to your .zshrc — ${name} will be available in new terminal sessions${RESET}`)
  } else {
    console.log(`  ${DIM}to activate now:  source ~/.clarissa/shells.sh${RESET}`)
  }
  console.log()
}
