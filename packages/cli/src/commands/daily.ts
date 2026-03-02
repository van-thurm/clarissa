import { getChart, getLocation } from '../state.js'
import { getMoonPhase, getMoonPhaseName, getMoonPhaseSymbol, getMoonGuidance } from '../astro/moon.js'
import { getDailyMessage, getSeasonalTransit } from '../astro/chart.js'

const RESET  = '\x1b[0m'
const DIM    = '\x1b[2m'
const BOLD   = '\x1b[1m'
const ACCENT = '\x1b[38;5;216m'

function hr(): string { return `  ${ACCENT}${'━'.repeat(49)}${RESET}` }

async function fetchWeather(location: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(
      `https://wttr.in/${encodeURIComponent(location)}?format=1`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    if (!res.ok) return null
    const text = (await res.text()).trim()
    if (text.length > 80 || text.includes('<html') || text.includes('Unknown')) return null
    return text
  } catch {
    return null
  }
}

export async function daily(): Promise<void> {
  const [data, location] = await Promise.all([getChart(), getLocation()])

  const now      = new Date()
  const phase    = getMoonPhase(now)
  const symbol   = getMoonPhaseSymbol(phase)
  const name     = getMoonPhaseName(phase)
  const guidance = getMoonGuidance(phase)
  const today    = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const transit  = getSeasonalTransit(now)

  const weather = location ? await fetchWeather(location) : null

  console.log()
  console.log(hr())
  console.log()
  console.log(`  ${BOLD}${today}${RESET}`)
  if (weather) {
    console.log(`  ${weather}`)
  }

  console.log()
  console.log(`  ${symbol}  ${BOLD}${name}${RESET}`)
  console.log(`  ${DIM}${guidance}${RESET}`)

  if (data) {
    const message = getDailyMessage(data, now)
    console.log()
    console.log(`  ${message}`)
  }

  console.log()
  console.log(hr())
  console.log()

  if (data) {
    console.log(`  ${ACCENT}☉${RESET} ${BOLD}${data.sun.sign}${RESET}  ${DIM}·${RESET}  ${ACCENT}☽${RESET} ${BOLD}${data.moon.sign}${RESET}  ${DIM}·${RESET}  ${ACCENT}↑${RESET} ${BOLD}${data.rising.sign}${RESET}`)
    console.log()
    console.log(hr())
    console.log()
  }

  console.log(`  ${DIM}${transit}${RESET}`)
  console.log()

  if (data) {
    console.log(`  ${DIM}clarissa me      full big three interpretations${RESET}`)
    console.log(`  ${DIM}clarissa chart   all 11 placements${RESET}`)
    console.log(`  ${DIM}clarissa advice  ask a question about today${RESET}`)
  } else {
    console.log(`  ${DIM}run ${RESET}${BOLD}clarissa setup${RESET}${DIM} to add your natal chart${RESET}`)
  }

  console.log()
}
