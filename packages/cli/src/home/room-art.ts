import {
  ROOM_ASCII_ROWS,
  ROOM_CODES,
  ROOM_HEIGHT,
  ROOM_HOTSPOTS,
  ROOM_MARKS,
  ROOM_PALETTE,
  ROOM_ROWS,
  ROOM_WIDTH,
} from './room-data.js'

const ESC = '\x1b['
const RESET = `${ESC}0m`

type RoomPaletteName = keyof typeof ROOM_PALETTE
export { ROOM_HOTSPOTS }

export interface RoomFrameOptions {
  focusIndex?: number
  useColor?: boolean
  status?: string
}

function foreground(name: RoomPaletteName): string {
  const [red, green, blue] = ROOM_PALETTE[name]
  return `${ESC}38;2;${red};${green};${blue}m`
}

function background(name: RoomPaletteName): string {
  const [red, green, blue] = ROOM_PALETTE[name]
  return `${ESC}48;2;${red};${green};${blue}m`
}

function paletteName(code: string): RoomPaletteName {
  const name = ROOM_CODES[code as keyof typeof ROOM_CODES]
  if (!name) throw new Error(`Unknown room color code: ${code}`)
  return name
}

function fit(value: string): string {
  return value.length >= ROOM_WIDTH
    ? value.slice(0, ROOM_WIDTH)
    : value.padEnd(ROOM_WIDTH, ' ')
}

function styleLine(value: string, name: RoomPaletteName, bold = false): string {
  return `${bold ? `${ESC}1m` : ''}${foreground(name)}${fit(value)}${RESET}`
}

function focusCells(focusIndex: number): Set<string> {
  const hotspot = ROOM_HOTSPOTS[focusIndex]
  const { x, y, w, h } = hotspot.box
  const right = x + w - 1
  const bottom = y + h - 1
  const cells = new Set<string>()
  const arm = 3
  const corners = [
    { x, y, dx: 1, dy: 1 },
    { x: right, y, dx: -1, dy: 1 },
    { x, y: bottom, dx: 1, dy: -1 },
    { x: right, y: bottom, dx: -1, dy: -1 },
  ]
  for (const corner of corners) {
    for (let offset = 0; offset < arm; offset += 1) {
      cells.add(`${corner.x + (corner.dx * offset)},${corner.y}`)
      cells.add(`${corner.x},${corner.y + (corner.dy * offset)}`)
    }
  }
  return cells
}

const MARKS = new Map(
  ROOM_MARKS.map(mark => [`${mark.x},${mark.y}`, mark]),
)

function renderColorArt(focusIndex: number): string[] {
  const focus = focusCells(focusIndex)
  const lines: string[] = []
  for (let y = 0; y < ROOM_HEIGHT; y += 1) {
    let line = ''
    let previousBackground = ''
    let previousForeground = ''
    for (let x = 0; x < ROOM_WIDTH; x += 1) {
      const key = `${x},${y}`
      const code = ROOM_ROWS[y][x]
      const backgroundName = focus.has(key) ? 'yellow' : paletteName(code)
      if (backgroundName !== previousBackground) {
        line += background(backgroundName)
        previousBackground = backgroundName
      }
      const mark = MARKS.get(key)
      if (mark) {
        const markColor = mark.foreground as RoomPaletteName
        if (markColor !== previousForeground) {
          line += foreground(markColor)
          previousForeground = markColor
        }
        line += mark.char
      } else {
        line += ' '
      }
    }
    lines.push(`${line}${RESET}`)
  }
  return lines
}

function renderAsciiArt(focusIndex: number): string[] {
  const focus = focusCells(focusIndex)
  return ROOM_ASCII_ROWS.map((row, y) => (
    [...row].map((character, x) => {
      const key = `${x},${y}`
      if (focus.has(key)) return '+'
      return MARKS.get(key)?.char ?? character
    }).join('')
  ))
}

export function renderRoomFrame(options: RoomFrameOptions = {}): string {
  const focusIndex = Math.max(
    0,
    Math.min(ROOM_HOTSPOTS.length - 1, options.focusIndex ?? 0),
  )
  const useColor = options.useColor ?? true
  const hotspot = ROOM_HOTSPOTS[focusIndex]
  const status = options.status ?? `Ready: ${hotspot.label}.`
  const header = `CLARISSA'S ROOM // 1995   FOCUS ${focusIndex + 1}/4: ${hotspot.shortLabel}`
  const help = 'LEFT/RIGHT or TAB focus | ENTER imagine | Q quit'
  const art = useColor ? renderColorArt(focusIndex) : renderAsciiArt(focusIndex)
  return [
    useColor ? styleLine(header, 'white', true) : fit(header),
    ...art,
    useColor ? styleLine(status, 'cyan') : fit(status),
    useColor ? styleLine(help, 'pinkLight') : fit(help),
  ].join('\n')
}

export const ROOM_MIN_COLUMNS = ROOM_WIDTH + 4
export const ROOM_MIN_ROWS = ROOM_HEIGHT + 4
