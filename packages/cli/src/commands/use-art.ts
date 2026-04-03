import * as readline from 'readline/promises'
import fs from 'fs/promises'
import { renderIcon } from '@clarissa/core'
import type { Icon } from '@clarissa/core'
import { getActivePalette, getWelcomeArt, setWelcomeArt, clearWelcomeArt } from '../state.js'
import { SHELLS_FILE, ZSHRC, bashEscape, ensureShellsFile, ensureZshrcSourced } from '../paths.js'
import { loadTheme, RESET, BOLD } from '../theme.js'

let DIM = '', ACCENT = ''

function hr(): string { return `  ${ACCENT}${'━'.repeat(49)}${RESET}` }

/**
 * After creating or selecting art, ask "what do you want to do with this?"
 * Returns true if the user took an action, false if they backed out.
 */
export async function useArt(icon: Icon): Promise<boolean> {
  const t = await loadTheme(); ACCENT = t.ACCENT; DIM = t.DIM
  const palette = await getActivePalette()

  console.log()
  console.log(renderIcon(icon, palette))
  console.log()
  console.log(hr())
  console.log(`  ${BOLD}${icon.name}${RESET}  ${DIM}— what do you want to do with this?${RESET}`)
  console.log(hr())
  console.log()
  console.log(`  ${ACCENT}a${RESET}  set as welcome art     ${DIM}shows when you open clarissa${RESET}`)
  console.log(`  ${ACCENT}b${RESET}  add to a jam           ${DIM}prints when you run a command${RESET}`)
  console.log(`  ${ACCENT}c${RESET}  add to terminal startup ${DIM}prints every new session${RESET}`)
  console.log()
  console.log(`  ${DIM}enter  just keep it saved${RESET}`)
  console.log()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const pick = (await rl.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()
  rl.close()

  switch (pick) {
    case 'a': {
      await setWelcomeArt(icon.name)
      console.log()
      console.log(`  ${DIM}welcome art set to${RESET} ${BOLD}${icon.name}${RESET}`)
      console.log()
      return true
    }
    case 'b': {
      return await addArtToJam(icon)
    }
    case 'c': {
      return await addToStartup(icon)
    }
    default:
      return false
  }
}

async function addArtToJam(icon: Icon): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  console.log()
  console.log(`  ${DIM}what should the command be called?${RESET}`)
  const name = (await rl.question(`  → `)).trim()

  if (!name || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
    rl.close()
    if (name) console.log(`  ${DIM}invalid name — letters, numbers, hyphens only${RESET}`)
    console.log()
    return false
  }

  console.log()
  console.log(`  ${DIM}should it also run a command after printing? (enter to skip)${RESET}`)
  const cmd = (await rl.question(`  → `)).trim()
  rl.close()

  const lines: string[] = [`function ${name}() {`]
  lines.push('  local _art=(')
  for (const row of icon.rows) lines.push(`    "${bashEscape(row)}"`)
  lines.push('  )')
  lines.push("  printf '%s\\n' \"${_art[@]}\"")
  if (cmd) lines.push(`  ${cmd}`)
  lines.push('}')

  await ensureShellsFile()
  await fs.appendFile(SHELLS_FILE, `\n${lines.join('\n')}\n`)
  const patched = await ensureZshrcSourced()

  console.log()
  console.log(`  ${BOLD}${name}${RESET} ${DIM}saved.${RESET}`)
  if (patched) {
    console.log(`  ${DIM}added to .zshrc — available in new terminal sessions${RESET}`)
  } else {
    console.log(`  ${DIM}to activate now:  source ~/.clarissa/shells.sh${RESET}`)
  }
  console.log()
  return true
}

// ── manage art placements ────────────────────────────────────────────────────

async function getStartupArtNames(): Promise<string[]> {
  let content = ''
  try { content = await fs.readFile(ZSHRC, 'utf-8') } catch { return [] }
  const names: string[] = []
  for (const line of content.split('\n')) {
    const m = line.match(/^# clarissa art: (.+)$/)
    if (m) names.push(m[1])
  }
  return names
}

async function removeStartupArt(name: string): Promise<boolean> {
  let content = ''
  try { content = await fs.readFile(ZSHRC, 'utf-8') } catch { return false }

  const marker = `# clarissa art: ${name}`
  if (!content.includes(marker)) return false

  const lines = content.split('\n')
  const out: string[] = []
  let skipping = false

  for (const line of lines) {
    if (line === marker) {
      skipping = true
      continue
    }
    if (skipping) {
      if (line.startsWith('echo "') || line.trim() === '') continue
      skipping = false
    }
    out.push(line)
  }

  await fs.writeFile(ZSHRC, out.join('\n'))
  return true
}

export async function manageArt(): Promise<void> {
  const t = await loadTheme(); ACCENT = t.ACCENT; DIM = t.DIM

  const [welcomeName, startupNames] = await Promise.all([
    getWelcomeArt(),
    getStartupArtNames(),
  ])

  const items: Array<{ label: string; type: 'welcome' | 'startup'; name: string }> = []

  if (welcomeName) items.push({ label: `welcome art: ${welcomeName}`, type: 'welcome', name: welcomeName })
  for (const s of startupNames) items.push({ label: `terminal startup: ${s}`, type: 'startup', name: s })

  console.log()
  console.log(hr())
  console.log(`  ${BOLD}manage art${RESET}`)
  console.log(hr())
  console.log()

  if (items.length === 0) {
    console.log(`  ${DIM}nothing set yet${RESET}`)
    console.log()
    return
  }

  const letters = 'abcdefghijklmnopqrstuvwxyz'
  for (let i = 0; i < items.length; i++) {
    console.log(`  ${ACCENT}${letters[i]}${RESET}  ${items[i].label}`)
  }
  console.log()
  console.log(`  ${DIM}pick one to remove, or q to go back${RESET}`)
  console.log()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const pick = (await rl.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()
  rl.close()

  if (pick === 'q' || pick === 'back' || !pick) return

  const idx = letters.indexOf(pick)
  if (idx < 0 || idx >= items.length) return

  const item = items[idx]

  switch (item.type) {
    case 'welcome':
      await clearWelcomeArt()
      console.log()
      console.log(`  ${DIM}welcome art cleared${RESET}`)
      console.log()
      break
    case 'startup': {
      const removed = await removeStartupArt(item.name)
      console.log()
      if (removed) {
        console.log(`  ${DIM}removed${RESET} ${BOLD}${item.name}${RESET} ${DIM}from .zshrc${RESET}`)
      } else {
        console.log(`  ${DIM}couldn't find ${item.name} in .zshrc${RESET}`)
      }
      console.log()
      break
    }
  }
}

async function addToStartup(icon: Icon): Promise<boolean> {
  return addRowsToStartup(icon.name, icon.rows)
}

async function addRowsToStartup(label: string, rows: string[]): Promise<boolean> {
  const printLines = rows.map(r => `echo "${bashEscape(r)}"`).join('\n')
  const block = [
    '',
    `# clarissa art: ${label}`,
    printLines,
    '',
  ].join('\n')

  const mark = `# clarissa art: ${label}`
  let content = ''
  try { content = await fs.readFile(ZSHRC, 'utf-8') } catch { /* no .zshrc */ }

  if (content.includes(mark)) {
    console.log()
    console.log(`  ${DIM}${label} is already in your terminal startup${RESET}`)
    console.log()
    return false
  }

  await fs.appendFile(ZSHRC, block)
  console.log()
  console.log(`  ${BOLD}${label}${RESET} ${DIM}added to .zshrc — prints every new session${RESET}`)
  console.log()
  return true
}

/**
 * Action menu for a rendered font -- what do you want to do with this text?
 */
export async function useFont(fontName: string, text: string, renderedRows: string[]): Promise<boolean> {
  const t = await loadTheme(); ACCENT = t.ACCENT; DIM = t.DIM

  console.log()
  console.log(hr())
  console.log(`  ${BOLD}${text}${RESET}  ${DIM}in ${fontName} — what do you want to do with this?${RESET}`)
  console.log(hr())
  console.log()
  console.log(`  ${ACCENT}a${RESET}  add to terminal startup  ${DIM}prints every new session${RESET}`)
  console.log(`  ${ACCENT}b${RESET}  create a jam             ${DIM}make it a shell command${RESET}`)
  console.log()
  console.log(`  ${DIM}enter  just admire it${RESET}`)
  console.log()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const pick = (await rl.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()
  rl.close()

  switch (pick) {
    case 'a': {
      const label = `font-${fontName.toLowerCase().replace(/\s+/g, '-')}-${text.toLowerCase().replace(/\s+/g, '-')}`
      return await addRowsToStartup(label, renderedRows)
    }
    case 'b': {
      return await addFontToJam(renderedRows)
    }
    default:
      return false
  }
}

async function addFontToJam(renderedRows: string[]): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  console.log()
  console.log(`  ${DIM}what should the command be called?${RESET}`)
  const name = (await rl.question(`  → `)).trim()

  if (!name || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
    rl.close()
    if (name) console.log(`  ${DIM}invalid name — letters, numbers, hyphens only${RESET}`)
    console.log()
    return false
  }

  console.log()
  console.log(`  ${DIM}should it also run a command after printing? (enter to skip)${RESET}`)
  const cmd = (await rl.question(`  → `)).trim()
  rl.close()

  const lines: string[] = [`function ${name}() {`]
  lines.push('  local _art=(')
  for (const row of renderedRows) lines.push(`    "${bashEscape(row)}"`)
  lines.push('  )')
  lines.push("  printf '\\033[38;5;216m'; printf '%s\\n' \"${_art[@]}\"; printf '\\033[0m'")
  if (cmd) lines.push(`  ${cmd}`)
  lines.push('}')

  await ensureShellsFile()
  await fs.appendFile(SHELLS_FILE, `\n${lines.join('\n')}\n`)
  const patched = await ensureZshrcSourced()

  console.log()
  console.log(`  ${BOLD}${name}${RESET} ${DIM}saved.${RESET}`)
  if (patched) {
    console.log(`  ${DIM}added to .zshrc — available in new terminal sessions${RESET}`)
  } else {
    console.log(`  ${DIM}to activate now:  source ~/.clarissa/shells.sh${RESET}`)
  }
  console.log()
  return true
}
