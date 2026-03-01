import fs from 'fs/promises'
import path from 'path'
import * as readline from 'readline/promises'
import { setChart, setLocation, getLocation } from '../state.js'
import type { ChartData, PlanetData } from '../state.js'
import { chart as showChart } from './chart.js'

const RESET = '\x1b[0m'
const DIM = '\x1b[2m'
const BOLD = '\x1b[1m'
const ACCENT = '\x1b[38;5;216m'

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

// Read existing ~/.clarissa/chart.conf for pre-filling
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

function prompt(rl: readline.Interface, question: string, fallback?: string): Promise<string> {
  const hint = fallback ? ` ${DIM}[${fallback}]${RESET}` : ''
  return rl.question(`  ${question}${hint}  `)
}

async function askSign(rl: readline.Interface, label: string, fallback?: string): Promise<string> {
  while (true) {
    const hint = fallback ? ` ${DIM}[${fallback}]${RESET}` : ''
    const raw = (await rl.question(`  ${label}${hint}  `)).trim()
    if (!raw && fallback) return fallback
    const match = SIGNS.find(s => s.toLowerCase() === raw.toLowerCase())
    if (match) return match
    // Accept 1-12 index
    const n = parseInt(raw, 10)
    if (n >= 1 && n <= 12) return SIGNS[n - 1]
    console.log(`  ${DIM}enter a sign name or 1–12${RESET}`)
  }
}

export async function setup(): Promise<void> {
  const existing = await readChartConf()
  const hasExisting = Object.keys(existing).length > 0

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  console.log()
  console.log(`  ${ACCENT}${'━'.repeat(49)}${RESET}`)
  console.log(`  ${BOLD}clarissa setup${RESET}`)
  if (hasExisting) {
    console.log(`  ${DIM}found existing chart — enter to keep · type to change${RESET}`)
  }
  console.log(`  ${ACCENT}${'━'.repeat(49)}${RESET}`)
  console.log()

  // ── birth info ────────────────────────────────────────────────────────────

  console.log(`  ${DIM}── birth info${RESET}`)
  console.log()

  const userName   = ((await prompt(rl, 'your name',   existing.USER_NAME)).trim()   || existing.USER_NAME   || '').trim()
  const birthDate  = ((await prompt(rl, 'birth date',  existing.BIRTH_DATE)).trim()  || existing.BIRTH_DATE  || '').trim()
  const birthTime  = ((await prompt(rl, 'birth time',  existing.BIRTH_TIME)).trim()  || existing.BIRTH_TIME  || '').trim()
  const birthPlace = ((await prompt(rl, 'birth place', existing.BIRTH_PLACE)).trim() || existing.BIRTH_PLACE || '').trim()

  console.log()

  // ── placements ────────────────────────────────────────────────────────────

  console.log(`  ${DIM}── placements  (sign name or 1–12)${RESET}`)
  console.log()

  const placements: Partial<ChartData> = {}
  for (const { key, label, glyph } of PLANETS) {
    const confKey = key.toUpperCase()
    const fallbackSign = existing[`${confKey}_SIGN`]
    const fallbackDeg  = existing[`${confKey}_DEGREE`] !== undefined
      ? parseInt(existing[`${confKey}_DEGREE`], 10)
      : undefined

    const sign = await askSign(rl, `${glyph}  ${label}`, fallbackSign)

    // Keep existing degree if sign is unchanged; otherwise default to mid-sign (15°)
    const degree = (fallbackSign && sign === fallbackSign && fallbackDeg !== undefined)
      ? fallbackDeg
      : 15

    ;(placements as Record<string, PlanetData>)[key] = { sign, degree }
    console.log()
  }

  // ── city ──────────────────────────────────────────────────────────────────

  console.log(`  ${DIM}── city${RESET}`)
  console.log()

  const existingCity = (await getLocation()) ?? ''
  const locationRaw = ((await rl.question(`  ${DIM}city for weather (optional)${existingCity ? ` [${existingCity}]` : ''}${RESET}  `)).trim()) || existingCity

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
  console.log(`  ${ACCENT}${'━'.repeat(49)}${RESET}`)
  console.log(`  ${BOLD}chart saved.${RESET}`)
  console.log(`  ${ACCENT}${'━'.repeat(49)}${RESET}`)
  console.log()

  await showChart()
}
