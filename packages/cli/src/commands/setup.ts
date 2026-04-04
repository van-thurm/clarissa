import fs from 'fs/promises'
import path from 'path'
import * as readline from 'readline/promises'
import { PALETTES, PALETTE_KEYS } from '@clarissa/core'
import type { PaletteKey } from '@clarissa/core'
import { setChart, setLocation, getLocation, getChart, getReposDir, setReposDir, getActivePalette, setActivePalette, getGoCommand, setGoCommand } from '../state.js'
import type { ChartData, PlanetData } from '../state.js'
import { ZSHRC } from '../paths.js'
import { chart as showChart } from './chart.js'
import { loadTheme, reloadTheme, RESET, BOLD } from '../theme.js'

let DIM = '', ACCENT = ''

function hr(): string { return `  ${ACCENT}${'━'.repeat(49)}${RESET}` }

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
               'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']

const PLANETS: Array<{ key: keyof Omit<ChartData, 'userName'|'birthDate'|'birthTime'|'birthPlace'>; label: string; glyph: string }> = [
  { key: 'sun',     label: 'Sun',     glyph: '☉' },
  { key: 'moon',    label: 'Moon',    glyph: '☽' },
  { key: 'rising',  label: 'Rising',  glyph: '↑' },
  { key: 'mercury', label: 'Mercury', glyph: '☿' },
  { key: 'venus',   label: 'Venus',   glyph: '♀' },
  { key: 'mars',    label: 'Mars',    glyph: '♂' },
  { key: 'jupiter', label: 'Jupiter', glyph: '♃' },
  { key: 'saturn',  label: 'Saturn',  glyph: '♄' },
  { key: 'uranus',  label: 'Uranus',  glyph: '♅' },
  { key: 'neptune', label: 'Neptune', glyph: '♆' },
  { key: 'pluto',   label: 'Pluto',   glyph: '♇' },
]

async function readChartConf(): Promise<Record<string, string>> {
  const confPath = path.join(process.env.HOME ?? '/tmp', '.clarissa', 'chart.conf')
  const raw = await fs.readFile(confPath, 'utf-8').catch(() => null)
  if (!raw) return {}
  const result: Record<string, string> = {}
  for (const line of raw.split('\n')) {
    const match = line.match(/^(\w+)="([^"]*)"/)
    if (match) result[match[1]] = match[2]
  }
  return result
}

class SetupCancelled extends Error {}

function promptField(rl: readline.Interface, question: string, fallback?: string): Promise<string> {
  const hint = fallback ? ` ${DIM}[${fallback}]${RESET}` : ''
  return rl.question(`  ${question}${hint}  `).then(v => {
    if (v.trim().toLowerCase() === 'q') throw new SetupCancelled()
    return v
  })
}

async function askSign(rl: readline.Interface, label: string, fallback?: string): Promise<string> {
  while (true) {
    const hint = fallback ? ` ${DIM}[${fallback}]${RESET}` : ''
    const raw = (await rl.question(`  ${label}${hint}  `)).trim()
    if (raw.toLowerCase() === 'q') throw new SetupCancelled()
    if (!raw && fallback) return fallback
    const match = SIGNS.find(s => s.toLowerCase() === raw.toLowerCase())
    if (match) return match
    const n = parseInt(raw, 10)
    if (n >= 1 && n <= 12) return SIGNS[n - 1]
    console.log(`  ${DIM}enter a sign name or 1–12${RESET}`)
  }
}

// ── palette ──────────────────────────────────────────────────────────────────

function paletteSwatch(p: { fill: number | null; accent: number; dim: number }): string {
  const blk = '███'
  const f = p.fill !== null ? `\x1b[38;5;${p.fill}m${blk}${RESET}` : blk
  const a = `\x1b[38;5;${p.accent}m${blk}${RESET}`
  const d = `\x1b[38;5;${p.dim}m${blk}${RESET}`
  return `${f}${a}${d}`
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

async function setupPalette(): Promise<void> {
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
    console.log(`  ${ACCENT}${LETTERS[i]}${RESET}  ${swatch}  ${p.label}  ${DIM}${p.vibe}${RESET}${active}`)
  }

  console.log()
  console.log(`  ${DIM}pick a palette, or q to go back${RESET}`)

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const pick = (await rl.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()
  rl.close()

  if (pick === 'q' || !pick) return

  let idx = pick.length === 1 ? LETTERS.indexOf(pick) : -1
  if ((idx < 0 || idx >= keys.length) && pick) idx = keys.findIndex(k => k.toLowerCase() === pick)

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

// ── quit + go ────────────────────────────────────────────────────────────────

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
  try { content = await fs.readFile(ZSHRC, 'utf-8') } catch {}
  if (content.includes(mark)) return false
  await fs.appendFile(ZSHRC, wrapper)
  return true
}

async function setupGoCommand(): Promise<void> {
  const current = await getGoCommand()

  console.log()
  console.log(hr())
  console.log(`  ${BOLD}quit + go${RESET}`)
  console.log(hr())
  console.log()
  if (current) {
    console.log(`  ${DIM}current:${RESET} ${current}`)
  } else {
    console.log(`  ${DIM}not set${RESET}`)
  }
  console.log()
  console.log(`  ${DIM}enter a command to run when you quit + go${RESET}`)
  console.log(`  ${DIM}use && to chain  e.g. cd ~/work && git pull && npm run dev${RESET}`)
  console.log()
  console.log(`  ${DIM}q  back${RESET}`)
  console.log()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const raw = (await rl.question(`  ${DIM}→${RESET}  `)).trim()
  rl.close()

  if (!raw || raw.toLowerCase() === 'q') return

  await setGoCommand(raw)
  const patched = await ensureGoWrapper()

  console.log()
  console.log(`  ${DIM}quit + go set to:${RESET} ${raw}`)
  if (patched) {
    console.log(`  ${DIM}added shell wrapper to .zshrc — restart your terminal to activate${RESET}`)
  }
  console.log()
}

// ── repos dir ────────────────────────────────────────────────────────────────

async function setupReposDir(): Promise<void> {
  const current = await getReposDir()

  console.log()
  console.log(hr())
  console.log(`  ${BOLD}repos dir${RESET}`)
  console.log(hr())
  console.log()
  if (current) {
    console.log(`  ${DIM}current:${RESET} ${current}`)
  } else {
    console.log(`  ${DIM}not set${RESET}`)
  }
  console.log()
  console.log(`  ${DIM}folder containing your git projects — for the special report${RESET}`)
  console.log()
  console.log(`  ${DIM}q  back${RESET}`)
  console.log()

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const raw = (await rl.question(`  ${DIM}path:${RESET}  `)).trim()
  rl.close()

  if (!raw || raw.toLowerCase() === 'q') return

  await setReposDir(raw)
  console.log()
  console.log(`  ${DIM}repos dir set to:${RESET} ${raw}`)
  console.log()
}

// ── birth chart ──────────────────────────────────────────────────────────────

async function setupBirthChart(): Promise<void> {
  const [conf, savedChart] = await Promise.all([readChartConf(), getChart()])
  const hasExisting = !!savedChart || Object.keys(conf).length > 0

  const fb = {
    userName:   savedChart?.userName   || conf.USER_NAME   || '',
    birthDate:  savedChart?.birthDate  || conf.BIRTH_DATE  || '',
    birthTime:  savedChart?.birthTime  || conf.BIRTH_TIME  || '',
    birthPlace: savedChart?.birthPlace || conf.BIRTH_PLACE || '',
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  console.log()
  console.log(hr())
  console.log(`  ${BOLD}birth chart${RESET}`)
  if (hasExisting) {
    console.log(`  ${DIM}enter to keep · type to change${RESET}`)
  }
  console.log(`  ${DIM}q to cancel at any prompt${RESET}`)
  console.log(hr())
  console.log()

  try {
    console.log(`  ${DIM}── birth info${RESET}`)
    console.log()

    const userName   = ((await promptField(rl, 'your name',   fb.userName  || undefined)).trim()   || fb.userName).trim()
    const birthDate  = ((await promptField(rl, 'birth date',  fb.birthDate || undefined)).trim()  || fb.birthDate).trim()
    const birthTime  = ((await promptField(rl, 'birth time',  fb.birthTime || undefined)).trim()  || fb.birthTime).trim()
    const birthPlace = ((await promptField(rl, 'birth place', fb.birthPlace|| undefined)).trim() || fb.birthPlace).trim()

    console.log()
    console.log(`  ${DIM}── placements  (sign name or 1–12)${RESET}`)
    console.log()

    const placements: Partial<ChartData> = {}
    for (const { key, label, glyph } of PLANETS) {
      const confKey = key.toUpperCase()
      const savedPlacement = savedChart?.[key] as PlanetData | undefined
      const fallbackSign = savedPlacement?.sign || conf[`${confKey}_SIGN`]
      const fallbackDeg  = savedPlacement?.degree ?? (conf[`${confKey}_DEGREE`] !== undefined
        ? parseInt(conf[`${confKey}_DEGREE`], 10)
        : undefined)

      const sign = await askSign(rl, `${glyph}  ${label}`, fallbackSign)
      const degree = (fallbackSign && sign === fallbackSign && fallbackDeg !== undefined)
        ? fallbackDeg
        : 15

      ;(placements as Record<string, PlanetData>)[key] = { sign, degree }
      console.log()
    }

    console.log(`  ${DIM}── city${RESET}`)
    console.log()

    const existingCity = (await getLocation()) ?? ''
    const cityInput = (await rl.question(`  ${DIM}city for weather (optional)${existingCity ? ` [${existingCity}]` : ''}${RESET}  `)).trim()
    if (cityInput.toLowerCase() === 'q') throw new SetupCancelled()
    const locationRaw = cityInput || existingCity

    rl.close()

    const chartData: ChartData = {
      userName,
      birthDate,
      birthTime,
      birthPlace,
      ...(placements as Pick<ChartData, 'sun'|'moon'|'rising'|'mercury'|'venus'|'mars'|'jupiter'|'saturn'|'uranus'|'neptune'|'pluto'>),
    }

    await setChart(chartData)
    if (locationRaw) await setLocation(locationRaw)

    console.log()
    console.log(hr())
    console.log(`  ${BOLD}chart saved.${RESET}`)
    console.log(hr())
    console.log()

    await showChart()
  } catch (e) {
    rl.close()
    if (e instanceof SetupCancelled) {
      console.log()
      console.log(`  ${DIM}cancelled${RESET}`)
      console.log()
      return
    }
    throw e
  }
}

// ── setup menu ───────────────────────────────────────────────────────────────

export async function setup(): Promise<void> {
  const t = await loadTheme(); ACCENT = t.ACCENT; DIM = t.DIM

  while (true) {
    const [activePalette, goCommand, reposDir, chart] = await Promise.all([
      getActivePalette(),
      getGoCommand(),
      getReposDir(),
      getChart(),
    ])

    const palLabel = PALETTES[activePalette].label
    const goLabel = goCommand || 'not set'
    const repoLabel = reposDir || 'not set'
    const chartLabel = chart?.userName ? `${chart.userName}, ${chart.sun?.sign || '?'}` : 'not set'

    console.log()
    console.log(hr())
    console.log(`  ${BOLD}setup${RESET}`)
    console.log(hr())
    console.log()
    console.log(`  ${ACCENT}a${RESET}  ${BOLD}palette${RESET}        ${DIM}${palLabel}${RESET}`)
    console.log(`  ${ACCENT}b${RESET}  ${BOLD}quit + go${RESET}      ${DIM}${goLabel}${RESET}`)
    console.log(`  ${ACCENT}c${RESET}  ${BOLD}repos dir${RESET}      ${DIM}${repoLabel}${RESET}`)
    console.log(`  ${ACCENT}d${RESET}  ${BOLD}birth chart${RESET}    ${DIM}${chartLabel}${RESET}`)
    console.log()
    console.log(`  ${DIM}q  back${RESET}`)
    console.log()

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const pick = (await rl.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()
    rl.close()

    switch (pick) {
      case 'a': case 'palette':
        await setupPalette()
        break
      case 'b': case 'go':
        await setupGoCommand()
        break
      case 'c': case 'repos':
        await setupReposDir()
        break
      case 'd': case 'chart':
        await setupBirthChart()
        break
      case 'q': case 'back':
        return
      default:
        if (pick) {
          console.log()
          console.log(`  ${DIM}press ${ACCENT}a${DIM}–${ACCENT}d${DIM} or ${ACCENT}q${RESET}`)
          console.log()
        }
    }
  }
}
