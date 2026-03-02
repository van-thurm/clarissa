import { getChart } from '../state.js'
import { getSign, getSunCore, getMoonCore, getRisingCore } from '../astro/signs.js'

const RESET = '\x1b[0m'
const DIM = '\x1b[2m'
const BOLD = '\x1b[1m'
const ACCENT = '\x1b[38;5;216m'
const WARM = '\x1b[38;5;180m'

function hr(): string { return `  ${ACCENT}${'━'.repeat(49)}${RESET}` }
function section(s: string): string { return `  ${WARM}▸${RESET} ${DIM}${s}${RESET}` }

export async function me(): Promise<void> {
  const data = await getChart()
  if (!data) {
    console.log(`\n  ${ACCENT}no chart found.${RESET} run ${BOLD}clarissa setup${RESET} to get started.\n`)
    return
  }

  const sun     = getSign(data.sun.sign)
  const moon    = getSign(data.moon.sign)
  const rising  = getSign(data.rising.sign)

  console.log()
  console.log(hr())
  console.log()
  console.log(section('THE BIG THREE'))
  console.log()

  // Sun
  console.log(`  ${ACCENT}☉${RESET}  ${BOLD}Sun in ${data.sun.sign}${RESET}  ${DIM}${data.sun.degree}°${RESET}`)
  console.log()
  console.log(`  ${getSunCore(data.sun.sign)}`)
  console.log()
  console.log(`  ${DIM}traits${RESET}     ${sun.traits}`)
  console.log(`  ${DIM}shadow${RESET}     ${sun.shadow}`)
  console.log(`  ${DIM}element${RESET}    ${sun.element}, ruled by ${sun.ruler}`)

  console.log()
  console.log(hr())
  console.log()

  // Moon
  console.log(`  ${ACCENT}☽${RESET}  ${BOLD}Moon in ${data.moon.sign}${RESET}  ${DIM}${data.moon.degree}°${RESET}`)
  console.log()
  console.log(`  ${getMoonCore(data.moon.sign)}`)
  console.log()
  console.log(`  ${DIM}needs${RESET}      ${moon.traits}`)
  console.log(`  ${DIM}shadow${RESET}     ${moon.shadow}`)
  console.log(`  ${DIM}element${RESET}    ${moon.element}`)

  console.log()
  console.log(hr())
  console.log()

  // Rising
  console.log(`  ${ACCENT}↑${RESET}  ${BOLD}${data.rising.sign} Rising${RESET}  ${DIM}${data.rising.degree}°${RESET}`)
  console.log()
  console.log(`  ${getRisingCore(data.rising.sign)}`)
  console.log()
  console.log(`  ${DIM}traits${RESET}     ${rising.traits}`)
  console.log(`  ${DIM}element${RESET}    ${rising.element}, ruled by ${rising.ruler}`)
  console.log()
}
