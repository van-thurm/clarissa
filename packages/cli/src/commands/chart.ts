import { getChart } from '../state.js'

import { loadTheme, RESET, BOLD } from '../theme.js'

let DIM = '', ACCENT = ''
function hr(): string { return `  ${ACCENT}${'━'.repeat(49)}${RESET}` }
function section(s: string): string { return `  ${ACCENT}▸${RESET} ${DIM}${s}${RESET}` }

function row(glyph: string, color: string, label: string, sign: string, degree: number, bold = false): string {
  const signStr = bold ? `${BOLD}${sign}${RESET}` : sign
  return `  ${color}${glyph}${RESET}  ${label.padEnd(11)} ${signStr}  ${DIM}${degree}°${RESET}`
}

export async function chart(): Promise<void> {
  const t = await loadTheme(); ACCENT = t.ACCENT; DIM = t.DIM
  const data = await getChart()
  if (!data) {
    console.log(`\n  ${ACCENT}no chart found.${RESET} run ${BOLD}clarissa setup${RESET} to get started.\n`)
    return
  }

  console.log()
  console.log(hr())
  console.log()
  console.log(`  ${BOLD}natal chart${RESET}`)
  console.log(`  ${DIM}${data.birthDate} · ${data.birthTime} · ${data.birthPlace}${RESET}`)
  console.log()
  console.log(section('THE BIG THREE'))
  console.log()
  console.log(row('☉', ACCENT, 'Sun',    data.sun.sign,    data.sun.degree,    true))
  console.log(row('☽', ACCENT, 'Moon',   data.moon.sign,   data.moon.degree,   true))
  console.log(row('↑', ACCENT, 'Rising', data.rising.sign, data.rising.degree, true))
  console.log()
  console.log(section('INNER PLANETS'))
  console.log()
  console.log(row('☿', DIM, 'Mercury', data.mercury.sign, data.mercury.degree))
  console.log(row('♀', DIM, 'Venus',   data.venus.sign,   data.venus.degree))
  console.log(row('♂', DIM, 'Mars',    data.mars.sign,    data.mars.degree))
  console.log()
  console.log(section('OUTER PLANETS'))
  console.log()
  console.log(row('♃', DIM, 'Jupiter', data.jupiter.sign, data.jupiter.degree))
  console.log(row('♄', DIM, 'Saturn',  data.saturn.sign,  data.saturn.degree))
  console.log(row('♅', DIM, 'Uranus',  data.uranus.sign,  data.uranus.degree))
  console.log(row('♆', DIM, 'Neptune', data.neptune.sign, data.neptune.degree))
  console.log(row('♇', DIM, 'Pluto',   data.pluto.sign,   data.pluto.degree))
  console.log()
}
