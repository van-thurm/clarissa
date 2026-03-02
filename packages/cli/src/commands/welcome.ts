import figlet from 'figlet'
import * as readline from 'readline/promises'
import fs from 'fs/promises'
import os from 'os'
import { PALETTES } from '@clarissa/core'
import { getActivePalette, getChart, getGoCommand, setGoCommand } from '../state.js'
import { getMoonPhase, getMoonPhaseName, getMoonPhaseSymbol, getMoonGuidance } from '../astro/moon.js'
import { getDailyMessage } from '../astro/chart.js'
import { daily } from './daily.js'
import { advice } from './advice.js'
import { crafts } from './crafts.js'
import { setup } from './setup.js'

const RESET = '\x1b[0m'
const DIM   = '\x1b[2m'
const BOLD  = '\x1b[1m'

function dim(s: string):  string { return `${DIM}${s}${RESET}` }
function bold(s: string): string { return `${BOLD}${s}${RESET}` }
function pal(code: number | null, s: string): string {
  return code === null ? s : `\x1b[38;5;${code}m${s}${RESET}`
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

// ── quit + go ─────────────────────────────────────────────────────────────────

const HOME         = os.homedir()
const CLARISSA_DIR = `${HOME}/.clarissa`
const GO_FILE      = `${CLARISSA_DIR}/.go`
const ZSHRC        = `${HOME}/.zshrc`

// Patches .zshrc with a function wrapper that evals the .go file after clarissa exits.
// This is what makes `cd` and other shell-context commands work in quit+go.
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

// ── welcome ───────────────────────────────────────────────────────────────────

const HR = dim('─'.repeat(48))

export async function welcome(): Promise<void> {
  const [activePalette, chart, goCommand] = await Promise.all([
    getActivePalette(),
    getChart(),
    getGoCommand(),
  ])

  const palette = PALETTES[activePalette]
  const now     = new Date()

  // Header
  const header = figlet.textSync('clarissa', { font: 'Small' })
  console.log()
  console.log(pal(palette.color, header.split('\n').map(l => `  ${l}`).join('\n')))

  // Moon
  const phase    = getMoonPhase(now)
  const symbol   = getMoonPhaseSymbol(phase)
  const name     = getMoonPhaseName(phase)
  const guidance = getMoonGuidance(phase)

  console.log()
  console.log(`  ${pal(palette.color, symbol)}  ${bold(name)}`)
  console.log(`     ${dim(guidance)}`)

  // Daily message (chart-aware)
  if (chart) {
    const message = getDailyMessage(chart, now)
    console.log()
    console.log(`     ${message}`)
  }

  // Lucky numbers
  const lucky = getDailyLucky(now)
  console.log()
  console.log(`  ${dim('✦  lucky:')}  ${lucky.map(n => bold(String(n).padStart(2))).join(dim('  ·  '))}`)

  // Menu
  console.log()
  console.log(`  ${HR}`)
  console.log()
  console.log(`  ${dim('1')}  ${bold('daily')}`)
  console.log(`  ${dim('2')}  ${bold('advice')}`)
  console.log(`  ${dim('3')}  ${bold('crafts')}`)
  console.log(`  ${dim('4')}  ${bold('setup')}`)
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
    case 'daily':
      rl.close()
      await daily()
      await welcome()
      break

    case '2':
    case 'advice': {
      const q = (await rl.question(`  ${dim("what's on your mind?")}  `)).trim()
      rl.close()
      console.log()
      if (q) await advice(q)
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
    case 'setup':
      rl.close()
      await setup()
      await welcome()
      break

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
      if (choice) console.log(`  ${dim('press 1 · 2 · 3 · 4 · g · q')}\n`)
  }
}
