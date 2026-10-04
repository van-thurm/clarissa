import * as readline from 'node:readline/promises'
import {
  AVATAR_HOME_MIN_COLUMNS,
  AVATAR_HOME_MIN_ROWS,
  HOME_MENU,
  renderAvatarHomeFrame,
} from './avatar.js'

const ESC = '\x1b['
const RESET = `${ESC}0m`
const CLEAR = `${ESC}2J`
const HOME = `${ESC}H`
const ALT_ON = `${ESC}?1049h`
const ALT_OFF = `${ESC}?1049l`
const CURSOR_HIDE = `${ESC}?25l`
const CURSOR_SHOW = `${ESC}?25h`
const AUTOWRAP_OFF = `${ESC}?7l`
const AUTOWRAP_ON = `${ESC}?7h`
const RESTORE = `${RESET}${AUTOWRAP_ON}${CURSOR_SHOW}${ALT_OFF}`
const RESIZE_DEBOUNCE_MS = 125

export type HomeChoice = (typeof HOME_MENU)[number]['key'] | 'q'

function terminalSize(): { columns: number; rows: number } {
  return {
    columns: process.stdout.columns ?? Number(process.env.COLUMNS),
    rows: process.stdout.rows ?? Number(process.env.LINES),
  }
}

function isLargeEnough(size: { columns: number; rows: number }): boolean {
  return Number.isFinite(size.columns)
    && Number.isFinite(size.rows)
    && size.columns >= AVATAR_HOME_MIN_COLUMNS
    && size.rows >= AVATAR_HOME_MIN_ROWS
}

function noColor(): boolean {
  return Object.prototype.hasOwnProperty.call(process.env, 'NO_COLOR')
    || process.env.TERM === 'dumb'
}

function positioned(frame: string): string {
  return frame.split('\n')
    .map((line, index) => `${ESC}${index + 1};1H${line}`)
    .join('')
}

function resizeMessage(size: { columns: number; rows: number }): string {
  return [
    'CLARISSA',
    `resize to at least ${AVATAR_HOME_MIN_COLUMNS}x${AVATAR_HOME_MIN_ROWS}`,
    `current: ${size.columns || '?'}x${size.rows || '?'} | q quit`,
  ].join('\n')
}

export function moveHomeSelection(
  selected: number,
  direction: 'left' | 'right' | 'up' | 'down' | 'next',
): number {
  const row = Math.floor(selected / 2)
  const column = selected % 2
  if (direction === 'left' || direction === 'right') {
    return (row * 2) + (column === 0 ? 1 : 0)
  }
  if (direction === 'up') return (((row + 2) % 3) * 2) + column
  if (direction === 'down') return (((row + 1) % 3) * 2) + column
  return (selected + 1) % HOME_MENU.length
}

async function lineMenu(): Promise<HomeChoice> {
  console.log()
  console.log('  clarissa')
  console.log()
  for (const item of HOME_MENU) {
    console.log(`  ${item.key}  ${item.label}`)
  }
  console.log()
  console.log('  q  quit')
  console.log()
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    const value = (await rl.question('  →  ')).trim().toLowerCase()
    if (value === 'q' || value === 'quit') return 'q'
    const item = HOME_MENU.find(entry => entry.key === value || entry.label === value)
    return item?.key ?? 'q'
  } finally {
    rl.close()
  }
}

export async function selectHomeMenu(): Promise<HomeChoice> {
  if (!process.stdin.isTTY || !process.stdout.isTTY || !isLargeEnough(terminalSize())) {
    return lineMenu()
  }

  const useColor = !noColor()
  const previousRawMode = Boolean(process.stdin.isRaw)

  return new Promise<HomeChoice>(resolve => {
    let selected = 0
    let status = 'choose something'
    let buffer = ''
    let closed = false
    let visible = true
    let resizeTimer: NodeJS.Timeout | null = null

    const clearResizeTimer = () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer)
        resizeTimer = null
      }
    }

    const draw = (clear = false) => {
      if (closed || !visible) return
      const frame = renderAvatarHomeFrame({
        selected,
        status,
        useColor,
        columns: process.stdout.columns,
      })
      process.stdout.write(`${clear ? `${CLEAR}${HOME}` : HOME}${positioned(frame)}`)
    }

    const cleanup = () => {
      clearResizeTimer()
      process.stdin.off('data', onData)
      process.stdout.off('resize', onResize)
      process.off('SIGINT', onSigint)
      process.off('SIGTERM', onSigterm)
      process.off('exit', onExit)
      if (process.stdin.isTTY && typeof process.stdin.setRawMode === 'function') {
        process.stdin.setRawMode(previousRawMode)
      }
      process.stdin.pause()
      process.stdout.write(RESTORE)
    }

    const finish = (choice: HomeChoice) => {
      if (closed) return
      closed = true
      cleanup()
      resolve(choice)
    }

    const move = (direction: Parameters<typeof moveHomeSelection>[1]) => {
      if (!visible) return
      selected = moveHomeSelection(selected, direction)
      status = HOME_MENU[selected].label
      draw()
    }

    function onData(chunk: string) {
      buffer += chunk
      while (buffer.length > 0) {
        if (buffer.startsWith('\x1b')) {
          if (buffer.length < 3) return
          const sequence = buffer.slice(0, 3)
          buffer = buffer.slice(3)
          if (sequence === '\x1b[D') move('left')
          if (sequence === '\x1b[C') move('right')
          if (sequence === '\x1b[A') move('up')
          if (sequence === '\x1b[B') move('down')
          continue
        }

        const key = buffer[0]
        buffer = buffer.slice(1)
        if (key === '\x03' || key === 'q' || key === 'Q') {
          finish('q')
          return
        }
        if (!visible) continue
        if (key >= '1' && key <= '6') {
          finish(key as HomeChoice)
          return
        }
        if (key === '\t') {
          move('next')
        } else if (key === '\r' || key === '\n') {
          finish(HOME_MENU[selected].key)
          return
        }
      }
    }

    function settleResize() {
      resizeTimer = null
      if (closed) return
      const size = terminalSize()
      visible = isLargeEnough(size)
      process.stdout.write(`${CLEAR}${HOME}`)
      if (visible) draw()
      else process.stdout.write(resizeMessage(size))
    }

    function onResize() {
      if (closed) return
      clearResizeTimer()
      resizeTimer = setTimeout(settleResize, RESIZE_DEBOUNCE_MS)
    }

    function onSigint() {
      finish('q')
    }

    function onSigterm() {
      finish('q')
    }

    function onExit() {
      if (!closed) process.stdout.write(RESTORE)
    }

    process.stdin.setEncoding('utf8')
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.on('data', onData)
    process.stdout.on('resize', onResize)
    process.once('SIGINT', onSigint)
    process.once('SIGTERM', onSigterm)
    process.once('exit', onExit)
    process.stdout.write(`${ALT_ON}${AUTOWRAP_OFF}${CLEAR}${HOME}${CURSOR_HIDE}`)
    draw()
  })
}
