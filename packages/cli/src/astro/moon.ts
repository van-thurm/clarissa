// Port of clarissa.sh moon calculation logic — pure functions, no I/O

const KNOWN_NEW_MOON = 946965600 // unix timestamp of a known new moon
const LUNAR_CYCLE = 2551443      // seconds in a lunar cycle (~29.5 days)

export function getMoonPhase(date: Date = new Date()): number {
  const now = Math.floor(date.getTime() / 1000)
  const diff = now - KNOWN_NEW_MOON
  const phaseSeconds = ((diff % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE
  return Math.floor(phaseSeconds / 86400)
}

export function getMoonPhaseName(phase: number): string {
  if (phase < 2)  return 'new moon'
  if (phase < 7)  return 'waxing crescent'
  if (phase < 9)  return 'first quarter'
  if (phase < 14) return 'waxing gibbous'
  if (phase < 16) return 'full moon'
  if (phase < 21) return 'waning gibbous'
  if (phase < 23) return 'last quarter'
  return 'waning crescent'
}

// Unicode circle chars — no emoji, placeholder until welcome screen design
export function getMoonPhaseSymbol(phase: number): string {
  if (phase < 2)  return '●'  // new moon (dark)
  if (phase < 7)  return '◔'  // waxing crescent
  if (phase < 9)  return '◑'  // first quarter
  if (phase < 14) return '◕'  // waxing gibbous
  if (phase < 16) return '○'  // full moon (open)
  if (phase < 21) return '◕'  // waning gibbous
  if (phase < 23) return '◑'  // last quarter
  return '◔'                  // waning crescent
}

export function getMoonGuidance(phase: number): string {
  const name = getMoonPhaseName(phase)
  const map: Record<string, string> = {
    'new moon':        'set intentions. plant seeds for new beginnings.',
    'waxing crescent': 'take first steps. build momentum.',
    'first quarter':   'push through challenges. commit to action.',
    'waxing gibbous':  'refine and adjust. almost there.',
    'full moon':       'harvest results. release what doesn\'t serve.',
    'waning gibbous':  'share wisdom. practice gratitude.',
    'last quarter':    'let go. forgive. clear space.',
    'waning crescent': 'rest and reflect. prepare for renewal.',
  }
  return map[name] ?? ''
}
