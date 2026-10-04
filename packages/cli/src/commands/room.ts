import {
  ROOM_HOTSPOTS,
  ROOM_MIN_COLUMNS,
  ROOM_MIN_ROWS,
  renderRoomFrame,
} from '../home/room-art.js'

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

function terminalSize(): { columns: number; rows: number } {
  return {
    columns: process.stdout.columns ?? Number(process.env.COLUMNS),
    rows: process.stdout.rows ?? Number(process.env.LINES),
  }
}

function isLargeEnough(size: { columns: number; rows: number }): boolean {
  return Number.isFinite(size.columns)
    && Number.isFinite(size.rows)
    && size.columns >= ROOM_MIN_COLUMNS
    && size.rows >= ROOM_MIN_ROWS
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
    "CLARISSA'S ROOM",
    `resize to at least ${ROOM_MIN_COLUMNS}x${ROOM_MIN_ROWS}`,
    `current: ${size.columns || '?'}x${size.rows || '?'} | q back`,
  ].join('\n')
}

export async function room(): Promise<void> {
  const useColor = !noColor()
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.log(renderRoomFrame({ focusIndex: 0, useColor: false }))
    return
  }
  if (!isLargeEnough(terminalSize())) {
    console.log(resizeMessage(terminalSize()))
    return
  }

  const previousRawMode = Boolean(process.stdin.isRaw)

  await new Promise<void>(resolve => {
    let focusIndex = 0
    let status = `Ready: ${ROOM_HOTSPOTS[focusIndex].label}.`
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
      const frame = renderRoomFrame({ focusIndex, useColor, status })
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

    const finish = () => {
      if (closed) return
      closed = true
      cleanup()
      resolve()
    }

    const move = (offset: number) => {
      if (!visible) return
      focusIndex = (focusIndex + offset + ROOM_HOTSPOTS.length) % ROOM_HOTSPOTS.length
      status = `Ready: ${ROOM_HOTSPOTS[focusIndex].label}.`
      draw()
    }

    function onData(chunk: string) {
      buffer += chunk
      while (buffer.length > 0) {
        if (buffer.startsWith('\x1b')) {
          if (buffer.length < 3) return
          const sequence = buffer.slice(0, 3)
          buffer = buffer.slice(3)
          if (sequence === '\x1b[D' || sequence === '\x1b[A') move(-1)
          if (sequence === '\x1b[C' || sequence === '\x1b[B') move(1)
          continue
        }
        const key = buffer[0]
        buffer = buffer.slice(1)
        if (key === '\x03' || key === 'q' || key === 'Q') {
          finish()
          return
        }
        if (!visible) continue
        if (key === '\t') {
          move(1)
        } else if (key === '\r' || key === '\n') {
          const hotspot = ROOM_HOTSPOTS[focusIndex]
          status = `${hotspot.label} -> ${hotspot.action}`
          draw()
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
      finish()
    }

    function onSigterm() {
      finish()
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
