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

// ── response pools ───────────────────────────────────────────────────────────

const WILDCARDS = [
  'are you asking the right question?',
  'sleep on it.',
  'your gut already decided.',
  'ask again when Mercury isn\'t being weird.',
  'that\'s a tomorrow problem.',
  'yes, but not the way you\'re thinking.',
  'honestly? you already know.',
  'the answer is in the question.',
  'try it and find out.',
  'not everything needs an answer today.',
  'let it marinate.',
  'what would future you say?',
  'are you asking me or telling me?',
]

// Phase pools: index 0–6 maps to phase ranges (new → balsamic)
const PHASE_RESPONSES: string[][] = [
  // 0: New moon (phase 0–3) — fresh starts
  [
    'yes. plant the seed.',
    'new moon says go — but start quiet.',
    'this is exactly the right time to begin.',
    'say yes. you can figure out the details later.',
    'fresh start energy. don\'t overthink it.',
  ],
  // 1: Waxing crescent (phase 4–7) — building momentum
  [
    'build on what you started. keep going.',
    'move forward, but stay grounded.',
    'momentum is building — don\'t stop now.',
    'yes, and take one more step than you think you should.',
    'the crescent says: trust the process.',
  ],
  // 2: First quarter (phase 8–11) — push through
  [
    'expect resistance. push through anyway.',
    'yes, but it won\'t be easy. do it anyway.',
    'this is the hard part. keep going.',
    'obstacles are just the universe checking your commitment.',
    'quarter moon energy: act decisively.',
  ],
  // 3: Full moon (phase 12–15) — act boldly
  [
    'the timing is right. go for it.',
    'full moon says yes — trust what you see clearly now.',
    'act with confidence. everything is illuminated.',
    'this is your moment. don\'t hold back.',
    'obviously.',
  ],
  // 4: Waning gibbous (phase 16–19) — share and reflect
  [
    'share what you know before you move on.',
    'yes, but give before you take.',
    'slow down and appreciate what you have.',
    'the answer is generosity.',
    'teach someone else what you\'ve learned first.',
  ],
  // 5: Last quarter (phase 20–23) — release
  [
    'let it go. clear space first.',
    'not today. simplify.',
    'release what isn\'t working before adding more.',
    'the moon says no. trust that.',
    'sometimes the answer is less, not more.',
  ],
  // 6: Balsamic/dark moon (phase 24–28) — rest
  [
    'rest today. fresh energy comes soon.',
    'not now. wait for the new moon.',
    'the dark moon says: be still.',
    'honor the quiet. the answer will come.',
    'pause. you don\'t need to decide right now.',
  ],
]

function getPhaseIndex(phase: number): number {
  if (phase < 4)  return 0
  if (phase < 8)  return 1
  if (phase < 12) return 2
  if (phase < 16) return 3
  if (phase < 20) return 4
  if (phase < 24) return 5
  return 6
}

// Deterministic hash — same question + same day = same answer
function simpleHash(str: string): number {
  let h = 2166136261
  for (const c of str) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 16777619)
    h >>>= 0
  }
  return h >>> 0
}

function pickResponse(question: string, phase: number, now: Date): string {
  const dateStr = now.toDateString()
  const hash = simpleHash(dateStr + '|' + question.toLowerCase().trim())

  // 25% chance of wildcard
  if (hash % 4 === 0) {
    return WILDCARDS[hash % WILDCARDS.length]
  }

  const pool = PHASE_RESPONSES[getPhaseIndex(phase)]
  return pool[hash % pool.length]
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
  console.log(`  ${data.sun.sign} Sun ${DIM}·${RESET} ${data.moon.sign} Moon ${DIM}·${RESET} ${data.rising.sign} Rising`)
  console.log()

  const response = pickResponse(question, phase, now)
  console.log(`  ${ACCENT}→ ${response}${RESET}`)

  console.log()
  console.log(hr())
  console.log(`  ${DIM}${daily}${RESET}`)
  console.log()
}
