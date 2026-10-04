import * as readline from 'node:readline/promises'
import { getChart } from '../state.js'
import { selectHomeMenu } from '../home/menu.js'
import { loadTheme, RESET, BOLD } from '../theme.js'
import { advice } from './advice.js'
import { chart } from './chart.js'
import { crafts } from './crafts.js'
import { daily } from './daily.js'
import { me } from './me.js'
import { planetarium } from './planetarium.js'
import { room } from './room.js'
import { setup } from './setup.js'

let DIM = ''
let ACCENT = ''

function dim(value: string): string {
  return `${DIM}${value}${RESET}`
}

function showHoroscopeActions(hasChart: boolean): void {
  console.log()
  console.log(`  ${ACCENT}${'━'.repeat(49)}${RESET}`)
  console.log(`  ${BOLD}horoscope${RESET}`)
  console.log(`  ${ACCENT}${'━'.repeat(49)}${RESET}`)
  console.log()
  if (hasChart) {
    console.log(`  ${ACCENT}a${RESET}  ${BOLD}big three${RESET}`)
    console.log(`  ${ACCENT}b${RESET}  ${BOLD}natal chart${RESET}`)
    console.log(`  ${ACCENT}c${RESET}  ${BOLD}advice${RESET}`)
  } else {
    console.log(`  ${ACCENT}a${RESET}  ${BOLD}setup birth chart${RESET}`)
  }
  console.log()
  console.log(`  ${DIM}q  back${RESET}`)
  console.log()
}

async function ask(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    return (await rl.question(prompt)).trim()
  } finally {
    rl.close()
  }
}

async function waitForBack(): Promise<void> {
  while (true) {
    const choice = (await ask(`  ${DIM}q  back${RESET}\n\n  ${DIM}→${RESET}  `)).toLowerCase()
    if (!choice || choice === 'q' || choice === 'back') return
    console.log()
    console.log(`  ${DIM}press ${ACCENT}q${DIM} to go back${RESET}`)
    console.log()
  }
}

async function askAdviceQuestion(): Promise<boolean> {
  while (true) {
    const hasChart = Boolean(await getChart())
    if (!hasChart) {
      showHoroscopeActions(false)
      const choice = (await ask(`  ${DIM}→${RESET}  `)).toLowerCase()
      if (choice === 'a' || choice === 'setup') {
        await setup()
        continue
      }
      return false
    }

    const question = await ask(`  ${dim("what's on your mind?")}  `)
    console.log()
    if (!question || question.toLowerCase() === 'q') return false
    await advice(question)
    return true
  }
}

async function todayView(): Promise<void> {
  await daily({ showCommandHints: false })
  await waitForBack()
}

async function horoscopeMenu(): Promise<void> {
  while (true) {
    const hasChart = Boolean(await getChart())
    showHoroscopeActions(hasChart)
    const choice = (await ask(`  ${DIM}→${RESET}  `)).toLowerCase()

    if (!choice || choice === 'q' || choice === 'back') return
    if (!hasChart && (choice === 'a' || choice === 'setup')) {
      await setup()
      continue
    }

    if (hasChart && (choice === 'a' || choice === 'me')) {
      await me()
    } else if (hasChart && (choice === 'b' || choice === 'chart')) {
      await chart()
    } else if (hasChart && (choice === 'c' || choice === 'advice')) {
      await askAdviceQuestion()
    } else {
      console.log()
      console.log(
        hasChart
          ? `  ${DIM}press ${ACCENT}a${DIM} · ${ACCENT}b${DIM} · ${ACCENT}c${DIM} · ${ACCENT}q${RESET}`
          : `  ${DIM}press ${ACCENT}a${DIM} · ${ACCENT}q${RESET}`,
      )
      console.log()
    }
  }
}

export async function welcome(): Promise<void> {
  const theme = await loadTheme()
  ACCENT = theme.ACCENT
  DIM = theme.DIM

  while (true) {
    const choice = await selectHomeMenu()
    if (choice === 'q') return

    if (choice === '1') {
      await todayView()
    } else if (choice === '2') {
      await horoscopeMenu()
    } else if (choice === '3') {
      await crafts()
    } else if (choice === '4') {
      await planetarium()
    } else if (choice === '5') {
      await room()
    } else if (choice === '6') {
      await setup()
    }
  }
}
