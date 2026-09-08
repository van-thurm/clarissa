import { spawnSync, execSync } from 'child_process'
import * as readline from 'readline/promises'
import { loadTheme, RESET, BOLD } from '../theme.js'

let DIM = '', ACCENT = ''

function hr(): string { return `  ${ACCENT}${'━'.repeat(49)}${RESET}` }

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

const CITIES = [
  { label: 'Cincinnati', value: 'Cincinnati', note: "clarissa's house" },
  { label: 'New York', value: 'New York' },
  { label: 'Los Angeles', value: 'Los Angeles' },
  { label: 'Chicago', value: 'Chicago' },
  { label: 'London', value: 'London' },
  { label: 'Tokyo', value: 'Tokyo' },
  { label: 'Sydney', value: 'Sydney' },
]

function isInstalled(): boolean {
  try {
    execSync('astroterm --version', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

async function pickCity(): Promise<string | null> {
  while (true) {
    console.log()
    console.log(hr())
    console.log(`  ${BOLD}planetarium${RESET}`)
    console.log(hr())
    console.log()
    console.log(`  ${DIM}where are you watching from?${RESET}`)
    console.log()

    for (let i = 0; i < CITIES.length; i++) {
      const c = CITIES[i]
      const note = c.note ? `  ${DIM}← ${c.note}${RESET}` : ''
      console.log(`  ${ACCENT}${LETTERS[i]}${RESET}  ${c.label}${note}`)
    }

    console.log()
    console.log(`  ${ACCENT}${LETTERS[CITIES.length]}${RESET}  ${DIM}type a city name${RESET}`)
    console.log()
    console.log(`  ${DIM}q  back${RESET}`)
    console.log()

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const pick = (await rl.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()
    rl.close()

    if (pick === 'q' || pick === 'back') return null

    const idx = LETTERS.indexOf(pick)
    if (idx >= 0 && idx < CITIES.length) return CITIES[idx].value

    if (idx === CITIES.length) {
      const custom = await typeCity()
      if (custom) return custom
      continue
    }

    const match = CITIES.find(c => c.label.toLowerCase() === pick)
    if (match) return match.value

    if (pick) {
      console.log(`  ${DIM}press ${ACCENT}a${DIM}–${ACCENT}${LETTERS[CITIES.length]}${DIM} or ${ACCENT}q${RESET}`)
    }
  }
}

async function typeCity(): Promise<string | null> {
  console.log()
  console.log(`  ${DIM}type a city name (from astroterm's city list)${RESET}`)
  console.log()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const city = (await rl.question(`  ${DIM}→${RESET}  `)).trim()
  rl.close()

  if (!city || city.toLowerCase() === 'q') return null
  return city
}

async function pickSpeed(): Promise<number | null> {
  while (true) {
    console.log()
    console.log(`  ${DIM}speed?${RESET}`)
    console.log()
    console.log(`  ${ACCENT}a${RESET}  gentle (500x)`)
    console.log(`  ${ACCENT}b${RESET}  spinning (1000x)`)
    console.log()
    console.log(`  ${DIM}q  back${RESET}`)
    console.log()

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const pick = (await rl.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()
    rl.close()

    if (pick === 'q' || pick === 'back') return null
    if (pick === 'a' || pick === 'gentle') return 500
    if (pick === 'b' || pick === 'spinning') return 1000

    if (pick) {
      console.log(`  ${DIM}press ${ACCENT}a${DIM} or ${ACCENT}b${DIM} or ${ACCENT}q${RESET}`)
    }
  }
}

export async function planetarium(): Promise<void> {
  const t = await loadTheme()
  DIM = t.DIM
  ACCENT = t.ACCENT

  if (!isInstalled()) {
    console.log()
    console.log(`  ${DIM}astroterm is not installed${RESET}`)
    console.log(`  ${DIM}install it with:${RESET}  brew install astroterm`)
    console.log()
    return
  }

  const city = await pickCity()
  if (!city) return

  const speed = await pickSpeed()
  if (speed === null) return

  console.log()
  console.log(`  ${BOLD}${city}${RESET}  ${DIM}at ${speed}x${RESET}`)
  console.log()
  console.log(`  ${DIM}press esc to exit the planetarium${RESET}`)
  console.log()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const input = (await rl.question(`  ${DIM}→${RESET}  press enter to launch  `)).trim().toLowerCase()
  rl.close()

  if (input === 'q' || input === 'back') return

  spawnSync('astroterm', [
    '--color', '--constellations', '--unicode',
    '--city', city,
    '--speed', String(speed),
    '--fps', '64',
  ], { stdio: 'inherit' })

  console.log()
}
