// Port of clarissa.sh chart-level logic — pure functions, no I/O
import type { ChartData } from '../state.js'
import { SIGNS } from './signs.js'

const ALL_SIGNS = Object.keys(SIGNS)

function planetsArray(chart: ChartData): Array<{ name: string; sign: string }> {
  return [
    { name: 'Sun',     sign: chart.sun.sign     },
    { name: 'Moon',    sign: chart.moon.sign     },
    { name: 'Rising',  sign: chart.rising.sign   },
    { name: 'Mercury', sign: chart.mercury.sign  },
    { name: 'Venus',   sign: chart.venus.sign    },
    { name: 'Mars',    sign: chart.mars.sign     },
    { name: 'Jupiter', sign: chart.jupiter.sign  },
    { name: 'Saturn',  sign: chart.saturn.sign   },
    { name: 'Uranus',  sign: chart.uranus.sign   },
    { name: 'Neptune', sign: chart.neptune.sign  },
    { name: 'Pluto',   sign: chart.pluto.sign    },
  ]
}

export interface Stellium {
  sign: string
  planets: string[]
}

export function detectStelliums(chart: ChartData): Stellium[] {
  const counts: Record<string, string[]> = {}
  for (const { name, sign } of planetsArray(chart)) {
    if (!counts[sign]) counts[sign] = []
    counts[sign].push(name)
  }
  return ALL_SIGNS
    .filter(s => (counts[s]?.length ?? 0) >= 3)
    .map(s => ({ sign: s, planets: counts[s] }))
}

export interface ElementBalance {
  fire: string[]
  earth: string[]
  air: string[]
  water: string[]
}

export function getElementalBalance(chart: ChartData): ElementBalance {
  const result: ElementBalance = { fire: [], earth: [], air: [], water: [] }
  for (const { name, sign } of planetsArray(chart)) {
    const elem = SIGNS[sign]?.element
    if (elem) result[elem].push(name)
  }
  return result
}

export function getDailyMessage(chart: ChartData, date: Date = new Date()): string {
  const doy = getDayOfYear(date)
  const msgs = [
    "the archer's arrow flies truest when aimed at truth.",
    `your ${chart.moon.sign} moon needs tending. honor what you feel.`,
    `${chart.rising.sign} rising: trust your first impression of things.`,
    `Mars in ${chart.mars.sign} whispers: go deep, not wide.`,
    "your Sagittarius stellium demands adventure.",
    `Venus in ${chart.venus.sign} reminds you: build something lasting.`,
    "Saturn conjunct your Sun: discipline IS freedom.",
    `Mercury in ${chart.mercury.sign}: your words carry weight.`,
    "the centaur runs toward the horizon. what calls to you?",
    "your chart is heavy with fire. create, inspire, illuminate.",
    `Pluto in ${chart.pluto.sign}: transform what needs changing.`,
    `Neptune in ${chart.neptune.sign}: dream practically, manifest mystically.`,
    "Uranus in Sagittarius: your rebellion serves truth.",
    "the archer needs open sky. make space for possibility.",
    "your moon needs nurturing. care for yourself first.",
    "fire dominant chart: you warm everyone around you.",
    "Saturn lessons are hard but valuable. what are you learning?",
    "Jupiter expands whatever it touches. choose your focus.",
    "Sagittarius sun: optimism is your superpower.",
    `Mars in ${chart.mars.sign}: when you commit, you're unstoppable.`,
    `Venus in ${chart.venus.sign}: love is built brick by brick.`,
    "your stellium makes you intense. that's a feature.",
    "Mercury conjunct Sun: you ARE your ideas.",
    "the archer's bow requires tension. embrace creative pressure.",
    `${chart.moon.sign} moon: honor your feelings, they're information.`,
    "today is a good day to be exactly who you are.",
    "your chart screams: MEANING MATTERS. seek it. create it.",
  ]
  return msgs[doy % msgs.length]
}

export function getSeasonalTransit(date: Date = new Date()): string {
  const m = date.getMonth() + 1
  if (m === 12 || m <= 2) return "Capricorn season grounds your fire. good for practical manifestation."
  if (m <= 5)             return "Aries season activates your chart. energy for new beginnings."
  if (m <= 8)             return "Cancer season touches your moon. emotional insights incoming."
  return "Sagittarius approaches. solar return brings renewal."
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  return Math.floor(diff / 86400000)
}
