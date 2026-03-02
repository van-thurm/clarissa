import { getChart } from '../state.js'
import { getMoonPhase, getMoonPhaseName, getMoonPhaseSymbol, getMoonGuidance } from '../astro/moon.js'
import { getSignFromDate } from '../astro/signs.js'
import { getDailyMessage } from '../astro/chart.js'

const RESET = '\x1b[0m'
const DIM = '\x1b[2m'
const BOLD = '\x1b[1m'
const ACCENT = '\x1b[38;5;216m'

function hr(): string { return `  ${ACCENT}${'━'.repeat(49)}${RESET}` }

const NOT_TODAY_PATTERNS = [
  'next week', 'next month', 'next year', 'tomorrow', 'yesterday',
  'last week', 'last month', 'in the future', 'someday', 'eventually',
  "when i'm older", 'years from now',
]

function isNotToday(question: string): boolean {
  const q = question.toLowerCase()
  return NOT_TODAY_PATTERNS.some(p => q.includes(p))
}

export async function advice(question: string): Promise<void> {
  const data = await getChart()
  if (!data) {
    console.log(`\n  ${ACCENT}no chart found.${RESET} run ${BOLD}clarissa setup${RESET} to get started.\n`)
    return
  }

  if (!question.trim()) {
    console.log()
    console.log(`  ${ACCENT}clarissa needs a question.${RESET}`)
    console.log(`  ${DIM}usage:${RESET} clarissa advice <your question about today>`)
    console.log(`  ${DIM}example:${RESET} clarissa advice should i start that project today?`)
    console.log()
    return
  }

  const now         = new Date()
  const phase       = getMoonPhase(now)
  const phaseName   = getMoonPhaseName(phase)
  const symbol      = getMoonPhaseSymbol(phase)
  const guidance    = getMoonGuidance(phase)
  const currentSign = getSignFromDate(now)
  const daily       = getDailyMessage(data, now)
  const today       = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  console.log()
  console.log(hr())
  console.log()

  if (isNotToday(question)) {
    console.log(`  ${ACCENT}clarissa can only answer about today.${RESET}`)
    console.log()
    console.log(`  the stars speak to the present moment, not the`)
    console.log(`  distant future. rephrase for ${today}.`)
    console.log()
    console.log(`  ${DIM}example: "should i start working on that today?"${RESET}`)
    console.log()
    return
  }

  console.log(`  ${BOLD}${today}${RESET}`)
  console.log()
  console.log(`  ${symbol}  ${BOLD}${phaseName}${RESET}`)
  console.log(`  ${DIM}${guidance}${RESET}`)
  console.log()
  console.log(`  ${DIM}"${question}"${RESET}`)
  console.log()
  console.log(`  Sun in ${currentSign} ${DIM}·${RESET} Moon is ${phaseName}`)
  console.log()
  console.log(`  ${DIM}for your chart${RESET}`)
  console.log(`  ${data.sun.sign} Sun ${DIM}·${RESET} ${data.moon.sign} Moon ${DIM}·${RESET} ${data.rising.sign} Rising`)
  console.log()

  if (phase < 4) {
    console.log(`  the new moon energy supports fresh starts. your`)
    console.log(`  ${data.rising.sign} rising says: trust your intuition. your`)
    console.log(`  ${data.sun.sign} Sun says: aim for what feels meaningful.`)
    console.log()
    console.log(`  ${ACCENT}→ yes, but start small. plant the seed today.${RESET}`)
  } else if (phase < 8) {
    console.log(`  the waxing crescent builds momentum. your Mars in`)
    console.log(`  ${data.mars.sign} gives you intense focus. your ${data.moon.sign} Moon`)
    console.log(`  wants security first. ground yourself, then act.`)
    console.log()
    console.log(`  ${ACCENT}→ move forward, but stay grounded. build carefully.${RESET}`)
  } else if (phase < 12) {
    console.log(`  first quarter moon brings challenges. your fire stellium`)
    console.log(`  gives you courage to push through obstacles.`)
    console.log()
    console.log(`  ${ACCENT}→ expect resistance. push through anyway.${RESET}`)
  } else if (phase < 16) {
    console.log(`  the full moon illuminates truth. your ${data.moon.sign} Moon`)
    console.log(`  feels this intensely — emotions may be high. your`)
    console.log(`  ${data.sun.sign} fire keeps you moving forward.`)
    console.log()
    console.log(`  ${ACCENT}→ the timing is ripe. act with confidence.${RESET}`)
  } else if (phase < 20) {
    console.log(`  waning gibbous is for sharing and gratitude. your`)
    console.log(`  ${data.sun.sign} teaching energy shines now. Venus in`)
    console.log(`  ${data.venus.sign} reminds you: quality over speed.`)
    console.log()
    console.log(`  ${ACCENT}→ share what you know. give before you take.${RESET}`)
  } else if (phase < 24) {
    console.log(`  last quarter asks: what needs releasing? Saturn in`)
    console.log(`  ${data.saturn.sign} knows discipline. let go of what's not working.`)
    console.log()
    console.log(`  ${ACCENT}→ clear space first. simplify, then proceed.${RESET}`)
  } else {
    console.log(`  the dark moon approaches — time for rest and reflection.`)
    console.log(`  your ${data.rising.sign} Rising feels the pull of quiet. honor it.`)
    console.log()
    console.log(`  ${ACCENT}→ rest today. fresh energy comes soon.${RESET}`)
  }

  console.log()
  console.log(hr())
  console.log(`  ${DIM}${daily}${RESET}`)
  console.log()
}
