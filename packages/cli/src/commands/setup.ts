import fs from 'fs/promises'
import path from 'path'
import * as readline from 'readline/promises'
import { setChart, setLocation, getLocation, getChart, getReposDir, setReposDir } from '../state.js'
import type { ChartData, PlanetData } from '../state.js'
import { chart as showChart } from './chart.js'

import { loadTheme, RESET, BOLD } from '../theme.js'

let DIM = '', ACCENT = ''

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

class SetupCancelled extends Error {}

function prompt(rl: readline.Interface, question: string, fallback?: string): Promise<string> {
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

export async function setup(): Promise<void> {
  const t = await loadTheme(); ACCENT = t.ACCENT; DIM = t.DIM
  const [conf, savedChart, savedReposDir] = await Promise.all([readChartConf(), getChart(), getReposDir()])
  const hasExisting = !!savedChart || Object.keys(conf).length > 0

  // Prefer state.json (savedChart) over chart.conf for pre-filling
  const fb = {
    userName:   savedChart?.userName   || conf.USER_NAME   || '',
    birthDate:  savedChart?.birthDate  || conf.BIRTH_DATE  || '',
    birthTime:  savedChart?.birthTime  || conf.BIRTH_TIME  || '',
    birthPlace: savedChart?.birthPlace || conf.BIRTH_PLACE || '',
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  console.log()
  console.log(`  ${ACCENT}${'━'.repeat(49)}${RESET}`)
  console.log(`  ${BOLD}clarissa setup${RESET}`)
  if (hasExisting) {
    console.log(`  ${DIM}found existing chart — enter to keep · type to change${RESET}`)
  }
  console.log(`  ${DIM}q to cancel at any prompt${RESET}`)
  console.log(`  ${ACCENT}${'━'.repeat(49)}${RESET}`)
  console.log()

  try {
    // ── birth info ──────────────────────────────────────────────────────────

    console.log(`  ${DIM}── birth info${RESET}`)
    console.log()

    const userName   = ((await prompt(rl, 'your name',   fb.userName  || undefined)).trim()   || fb.userName).trim()
    const birthDate  = ((await prompt(rl, 'birth date',  fb.birthDate || undefined)).trim()  || fb.birthDate).trim()
    const birthTime  = ((await prompt(rl, 'birth time',  fb.birthTime || undefined)).trim()  || fb.birthTime).trim()
    const birthPlace = ((await prompt(rl, 'birth place', fb.birthPlace|| undefined)).trim() || fb.birthPlace).trim()

    console.log()

    // ── placements ──────────────────────────────────────────────────────────

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

    // ── city ────────────────────────────────────────────────────────────────

    console.log(`  ${DIM}── city${RESET}`)
    console.log()

    const existingCity = (await getLocation()) ?? ''
    const cityInput = (await rl.question(`  ${DIM}city for weather (optional)${existingCity ? ` [${existingCity}]` : ''}${RESET}  `)).trim()
    if (cityInput.toLowerCase() === 'q') throw new SetupCancelled()
    const locationRaw = cityInput || existingCity

    console.log()

    // ── repos dir ────────────────────────────────────────────────────────────

    console.log(`  ${DIM}── repos dir${RESET}`)
    console.log()
    console.log(`  ${DIM}folder containing your git projects — for the special report${RESET}`)
    console.log()
    const reposDirInput = (await rl.question(`  ${DIM}projects folder${savedReposDir ? ` [${savedReposDir}]` : ' (optional)'}${RESET}  `)).trim()
    if (reposDirInput.toLowerCase() === 'q') throw new SetupCancelled()
    const reposDirRaw = reposDirInput || savedReposDir || ''

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
    if (reposDirRaw) await setReposDir(reposDirRaw)

    console.log()
    console.log(`  ${ACCENT}${'━'.repeat(49)}${RESET}`)
    console.log(`  ${BOLD}chart saved.${RESET}`)
    console.log(`  ${ACCENT}${'━'.repeat(49)}${RESET}`)
    console.log()

    await showChart()
  } catch (e) {
    rl.close()
    if (e instanceof SetupCancelled) {
      console.log()
      console.log(`  ${DIM}setup cancelled${RESET}`)
      console.log()
      return
    }
    throw e
  }
}
