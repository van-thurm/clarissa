import figlet from 'figlet'
import * as readline from 'readline/promises'
import fs from 'fs/promises'
import os from 'os'
import { PALETTES } from '@clarissa/core'
import { getActivePalette, getChart, getGoCommand, getLocation, setGoCommand } from '../state.js'
import { getMoonPhase, getMoonPhaseName, getMoonPhaseSymbol, getMoonGuidance } from '../astro/moon.js'
import { getDailyMessage } from '../astro/chart.js'
import { fetchWeather } from './daily.js'
import { daily } from './daily.js'
import { advice } from './advice.js'
import { crafts } from './crafts.js'
import { setup } from './setup.js'
import { specialReport } from './special-report.js'

const RESET = '\x1b[0m'
const DIM   = '\x1b[2m'
const BOLD  = '\x1b[1m'
const ACCENT = '\x1b[38;5;216m'

function dim(s: string):  string { return `${DIM}${s}${RESET}` }
function bold(s: string): string { return `${BOLD}${s}${RESET}` }
function pal(code: number | null, s: string): string {
  return code === null ? s : `\x1b[38;5;${code}m${s}${RESET}`
}

// Curated two-tone color pairs [full █, halfdots ░▀▄]
const HEADER_SCHEMES: [number, number][] = [
  [183, 213],  // lavender + pink
  [87,  227],  // teal + yellow
  [216, 158],  // coral + mint
  [141, 51 ],  // purple + cyan
  [214, 39 ],  // orange + blue
  [213, 220],  // pink + gold
  [118, 213],  // green + pink
  [75,  208],  // sky + orange
  [122, 141],  // mint + purple
  [51,  216],  // cyan + coral
]

function renderTwoTone(line: string, primary: number, accent: number): string {
  return line.split('').map(ch => {
    if (ch === '█') return `\x1b[38;5;${primary}m${ch}${RESET}`
    if ('░▒▓▀▄▌▐'.includes(ch)) return `\x1b[38;5;${accent}m${ch}${RESET}`
    return ch
  }).join('')
}

// ── lucky numbers — seeded by date, same all day, resets at midnight ──────────

function dateHash(str: string): number {
  let h = 2166136261
  for (const c of str) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 16777619)
    h >>>= 0
  }
  return h >>> 0
}

function getDailyLucky(date: Date = new Date()): number[] {
  let seed = dateHash(date.toDateString())
  const next = (): number => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
    return seed
  }
  const nums = new Set<number>()
  while (nums.size < 7) nums.add((next() % 49) + 1)
  return [...nums].sort((a, b) => a - b)
}

// ── nav pause ────────────────────────────────────────────────────────────────

// Returns the shortcut key if user wants to jump directly, or null for menu
async function waitForMenu(): Promise<string | null> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  console.log(`  ${DIM}─────────────────────────────────────${RESET}`)
  console.log(`  ${ACCENT}m${RESET} ${DIM}menu${RESET}  ${DIM}·${RESET}  ${ACCENT}q${RESET} ${DIM}quit${RESET}`)
  console.log()

  while (true) {
    const pick = (await rl.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()

    if (pick === 'q' || pick === 'quit') {
      rl.close()
      process.exit(0)
    }

    // m or enter → back to menu
    if (!pick || pick === 'm' || pick === 'menu') {
      rl.close()
      return null
    }

    // Allow jumping directly to a section
    if (['1', 'special-report', 'special', '2', 'advice', '3', 'crafts', '4', 'horoscope', 'daily', '5', 'setup', 'g', 'go'].includes(pick)) {
      rl.close()
      return pick
    }

    // Unrecognized input
    console.log(`  ${DIM}press ${ACCENT}m${DIM} for menu or ${ACCENT}q${DIM} to quit${RESET}`)
  }
}

// ── quit + go ─────────────────────────────────────────────────────────────────

const HOME         = os.homedir()
const CLARISSA_DIR = `${HOME}/.clarissa`
const GO_FILE      = `${CLARISSA_DIR}/.go`
const ZSHRC        = `${HOME}/.zshrc`

async function ensureGoWrapper(): Promise<boolean> {
  const mark = '# clarissa quit+go'
  const wrapper = [
    '',
    '# clarissa quit+go',
    'function clarissa() {',
    '  command clarissa "$@"',
    '  local _go=$(cat ~/.clarissa/.go 2>/dev/null)',
    '  if [[ -n "$_go" ]]; then',
    '    rm -f ~/.clarissa/.go',
    '    eval "$_go"',
    '  fi',
    '}',
    '',
  ].join('\n')

  let content = ''
  try { content = await fs.readFile(ZSHRC, 'utf-8') } catch { /* no .zshrc yet */ }
  if (content.includes(mark)) return false
  await fs.appendFile(ZSHRC, wrapper)
  return true
}

async function triggerGo(cmd: string): Promise<never> {
  await fs.mkdir(CLARISSA_DIR, { recursive: true })
  await fs.writeFile(GO_FILE, cmd)
  process.exit(0)
}

async function promptSetGoCommand(rl: readline.Interface): Promise<string | null> {
  console.log()
  console.log(`  ${dim('what should clarissa run when you quit + go?')}`)
  console.log(`  ${dim('use && to chain commands  e.g. cd ~/work && git pull')}`)
  console.log()
  const raw = (await rl.question(`  → `)).trim()
  return raw || null
}

// ── shortcut routing ─────────────────────────────────────────────────────────

async function handleChoice(choice: string): Promise<void> {
  // Forward to the welcome menu with a pre-selected choice
  // This avoids duplicating switch logic — just call welcome which handles it
  // But we need to skip the menu display and go straight to the action
  switch (choice) {
    case '1': case 'special-report': case 'special':
      await specialReport()
      await welcome()
      break
    case '2': case 'advice': {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
      const q = (await rl.question(`  ${dim("what's on your mind?")}  `)).trim()
      rl.close()
      console.log()
      if (q) {
        await advice(q)
        const j = await waitForMenu()
        if (j) return handleChoice(j)
      }
      await welcome()
      break
    }
    case '3': case 'crafts':
      await crafts()
      await welcome()
      break
    case '4': case 'horoscope': case 'daily':
      await daily()
      { const j = await waitForMenu(); if (j) return handleChoice(j) }
      await welcome()
      break
    case '5': case 'setup':
      await setup()
      { const j = await waitForMenu(); if (j) return handleChoice(j) }
      await welcome()
      break
    case 'g': case 'go':
      // Can't handle go from here cleanly, just go to menu
      await welcome()
      break
    default:
      await welcome()
  }
}

// ── welcome ───────────────────────────────────────────────────────────────────

const HR = dim('─'.repeat(48))

export async function welcome(): Promise<void> {
  const [activePalette, chart, goCommand, location] = await Promise.all([
    getActivePalette(),
    getChart(),
    getGoCommand(),
    getLocation(),
  ])

  const palette = PALETTES[activePalette]
  const now     = new Date()

  // Header
  const header = figlet.textSync('clarissa', { font: 'Pagga' })
  const [hPrimary, hAccent] = HEADER_SCHEMES[Math.floor(Math.random() * HEADER_SCHEMES.length)]
  console.log()
  console.log(header.split('\n').map(l => `  ${renderTwoTone(l, hPrimary, hAccent)}`).join('\n'))

  // Greeting
  if (chart?.userName) {
    console.log()
    console.log(`  ${dim('hey,')} ${bold(chart.userName)}`)
  }

  // Moon
  const phase    = getMoonPhase(now)
  const symbol   = getMoonPhaseSymbol(phase)
  const name     = getMoonPhaseName(phase)
  const guidance = getMoonGuidance(phase)

  console.log()
  console.log(`  ${pal(palette.color, symbol)}  ${bold(name)}`)
  console.log(`     ${dim(guidance)}`)

  // Date + weather
  const today = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const weather = location ? await fetchWeather(location) : null
  console.log()
  if (weather) {
    console.log(`  ${dim(today)}  ${DIM}·${RESET}  ${weather}`)
  } else {
    console.log(`  ${dim(today)}`)
  }

  // Lucky numbers
  const lucky = getDailyLucky(now)
  console.log()
  console.log(`  ${dim('✦  lucky:')}  ${lucky.map(n => bold(String(n).padStart(2))).join(dim('  ·  '))}`)

  // Menu
  console.log()
  console.log(`  ${HR}`)
  console.log()
  console.log(`  ${dim('1')}  ${bold('special report')}`)
  console.log(`  ${dim('2')}  ${bold('advice')}`)
  console.log(`  ${dim('3')}  ${bold('crafts')}`)
  console.log(`  ${dim('4')}  ${bold('horoscope')}`)
  console.log(`  ${dim('5')}  ${bold('setup')}`)
  console.log()
  console.log(`  ${dim('g')}  ${bold('quit + go')}  ${goCommand ? dim(goCommand) : dim('not set')}`)
  console.log(`  ${dim('q')}  quit`)
  console.log()

  // Prompt
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const choice = (await rl.question(`  ${dim('→')}  `)).trim().toLowerCase()

  console.log()

  switch (choice) {
    case '1':
    case 'special-report':
    case 'special': {
      rl.close()
      await specialReport()
      await welcome()
      break
    }

    case '2':
    case 'advice': {
      const q = (await rl.question(`  ${dim("what's on your mind?")}  `)).trim()
      rl.close()
      console.log()
      if (q) {
        await advice(q)
        const jump = await waitForMenu()
        if (jump) return handleChoice(jump)
      }
      await welcome()
      break
    }

    case '3':
    case 'crafts':
      rl.close()
      await crafts()
      await welcome()
      break

    case '4':
    case 'horoscope':
    case 'daily': {
      rl.close()
      await daily()
      const jump = await waitForMenu()
      if (jump) return handleChoice(jump)
      await welcome()
      break
    }

    case '5':
    case 'setup': {
      rl.close()
      await setup()
      const jump2 = await waitForMenu()
      if (jump2) return handleChoice(jump2)
      await welcome()
      break
    }

    case 'g':
    case 'go': {
      if (goCommand) {
        rl.close()
        await triggerGo(goCommand)
      } else {
        const cmd = await promptSetGoCommand(rl)
        rl.close()
        if (cmd) {
          await setGoCommand(cmd)
          const patched = await ensureGoWrapper()
          console.log()
          console.log(`  quit + go set to: ${dim(cmd)}`)
          if (patched) {
            console.log()
            console.log(`  ${dim('added to .zshrc — restart your terminal to activate')}`)
          }
          console.log()
          await triggerGo(cmd)
        }
      }
      break
    }

    case 'q':
    case 'quit':
      rl.close()
      process.exit(0)
      break

    default:
      rl.close()
      if (choice) console.log(`  ${dim('press 1 · 2 · 3 · 4 · 5 · g · q')}\n`)
      await welcome()
  }
}
