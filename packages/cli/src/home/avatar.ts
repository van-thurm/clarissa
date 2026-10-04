import figlet from 'figlet'
import {
  AVATAR_CODES,
  AVATAR_HEIGHT,
  AVATAR_PALETTE,
  AVATAR_ROWS,
  AVATAR_WIDTH,
  HOME_MENU,
} from './avatar-data.js'

const ESC = '\x1b['
const RESET = `${ESC}0m`
const ANSI_PATTERN = /\x1b\[[0-?]*[ -/]*[@-~]/g
const MIN_COLUMNS = 64

type PaletteName = keyof typeof AVATAR_PALETTE
export type HomeMenuItem = (typeof HOME_MENU)[number]
export type HomeExpression = HomeMenuItem['expression']

export { HOME_MENU }

export interface AvatarHomeFrameOptions {
  selected?: number
  status?: string
  useColor?: boolean
  columns?: number
}

function foreground(name: PaletteName): string {
  const [red, green, blue] = AVATAR_PALETTE[name]
  return `${ESC}38;2;${red};${green};${blue}m`
}

function background(name: PaletteName): string {
  const [red, green, blue] = AVATAR_PALETTE[name]
  return `${ESC}48;2;${red};${green};${blue}m`
}

function styled(
  text: string,
  color: readonly [number, number, number],
  options: { background?: readonly [number, number, number]; bold?: boolean } = {},
): string {
  const codes: string[] = []
  if (options.bold) codes.push('1')
  codes.push(`38;2;${color.join(';')}`)
  if (options.background) codes.push(`48;2;${options.background.join(';')}`)
  return `${ESC}${codes.join(';')}m${text}${RESET}`
}

function visibleLength(value: string): number {
  return [...value.replace(ANSI_PATTERN, '')].length
}

function center(value: string, width: number): string {
  const length = visibleLength(value)
  const left = Math.max(0, Math.floor((width - length) / 2))
  return `${' '.repeat(left)}${value}${' '.repeat(Math.max(0, width - left - length))}`
}

function padVisible(value: string, width: number): string {
  return `${value}${' '.repeat(Math.max(0, width - visibleLength(value)))}`
}

function paletteName(code: string): PaletteName {
  const name = AVATAR_CODES[code as keyof typeof AVATAR_CODES]
  if (!name) throw new Error(`Unknown avatar color code: ${code}`)
  return name
}

function avatarLines(expression: HomeExpression, useColor: boolean): string[] {
  const rows = AVATAR_ROWS[expression]
  const ascii: Record<PaletteName, string> = {
    blank: ' ',
    ink: '#',
    black: '@',
    cream: 'o',
    pink: '+',
    pinkLight: ':',
    cyan: '=',
    cyanDark: '-',
    yellow: '%',
    hairShadow: '*',
    hairLight: '^',
    skin: '.',
    skinShadow: ';',
    eye: 'O',
    mouth: 'v',
    orange: '/',
  }

  return rows.map(row => {
    if (!useColor) {
      return [...row].map(code => ascii[paletteName(code)]).join('')
    }

    let line = ''
    let previous = ''
    for (const code of row) {
      const name = paletteName(code)
      if (name === 'blank') {
        if (previous !== 'blank') {
          line += RESET
          previous = 'blank'
        }
        line += ' '
        continue
      }
      if (name !== previous) {
        line += background(name)
        previous = name
      }
      line += ' '
    }
    return `${line}${RESET}`
  })
}

function wordmarkLines(useColor: boolean): string[] {
  const lines = figlet.textSync('clarissa', { font: 'Pagga' })
    .split('\n')
    .filter(line => line.trim())
  if (!useColor) return lines
  return lines.map((line, index) => styled(
    line,
    index === 1 ? [0, 116, 140] : [177, 44, 103],
    { bold: true },
  ))
}

function menuItem(item: HomeMenuItem, index: number, selected: number, useColor: boolean): string {
  const text = ` ${item.key} ${item.label.toUpperCase()} `
  if (!useColor) return index === selected ? `[${text.trim()}]` : ` ${text.trim()} `
  return index === selected
    ? styled(text, [16, 18, 22], { background: [255, 211, 55], bold: true })
    : styled(text, [46, 48, 55])
}

function menuLine(
  leftIndex: number,
  rightIndex: number,
  selected: number,
  useColor: boolean,
): string {
  const left = menuItem(HOME_MENU[leftIndex], leftIndex, selected, useColor)
  const right = menuItem(HOME_MENU[rightIndex], rightIndex, selected, useColor)
  return `${padVisible(left, 31)}${right}`
}

export function renderAvatarHomeFrame(
  options: AvatarHomeFrameOptions = {},
): string {
  const selected = Math.max(0, Math.min(HOME_MENU.length - 1, options.selected ?? 0))
  const useColor = options.useColor ?? true
  const columns = options.columns ?? 80
  const width = Math.max(MIN_COLUMNS - 1, columns - 1)
  const status = options.status ?? 'choose something'
  const expression = HOME_MENU[selected].expression
  const lines = avatarLines(expression, useColor).map(line => center(line, width))

  lines.push('')
  for (const line of wordmarkLines(useColor)) lines.push(center(line, width))
  lines.push('')
  lines.push(center(menuLine(0, 1, selected, useColor), width))
  lines.push(center(menuLine(2, 3, selected, useColor), width))
  lines.push(center(menuLine(4, 5, selected, useColor), width))
  lines.push('')
  lines.push(center(
    useColor ? styled(status, [0, 116, 140], { bold: true }) : status,
    width,
  ))
  lines.push(center('ARROWS move  |  Q quit', width))
  return lines.join('\n')
}

export const AVATAR_HOME_MIN_COLUMNS = MIN_COLUMNS
export const AVATAR_HOME_MIN_ROWS = AVATAR_HEIGHT + 11
export const AVATAR_HOME_WIDTH = AVATAR_WIDTH
