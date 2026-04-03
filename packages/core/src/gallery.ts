import type { Icon } from './types.js'

function art(name: string, rows: string[]): Icon {
  return {
    name,
    source: 'built-in',
    size: 0,
    rows,
    created: '2026-03-28T00:00:00.000Z',
  }
}

export const GALLERY: Icon[] = [
  art('kitty', [
    "  /\\_/\\  ",
    " ( ^.^ ) ",
    "  > ^ <  ",
  ]),
  art('kitty-loaf', [
    "  /\\_/\\  ",
    " ( o.o ) ",
    " > ~ ~ < ",
    "  \"\"\"\"\"  ",
  ]),
  art('penguin', [
    "   W   ",
    "  ('>  ",
    "  /\u203e\\  ",
    "  \\_/  ",
    "  ~ ~  ",
  ]),
  art('bear', [
    " \u0255 \u2022\u1d25\u2022\u0294 ",
  ]),
  art('star', [
    "    .    ",
    "  .':'.  ",
    "-:  *  :-",
    "  '.'.'  ",
    "    '    ",
  ]),
  art('sun', [
    " \\ | / ",
    "- ( ) -",
    " / | \\ ",
  ]),
  art('snowflake', [
    "  *   ",
    " /|\\ ",
    "*-+-* ",
    " \\|/  ",
    "  *   ",
  ]),
  art('tree', [
    "   *   ",
    "  /|\\  ",
    " / | \\ ",
    "/__|__\\",
    "   |   ",
  ]),
  art('ghost', [
    " .---. ",
    "/ o o \\",
    "|  ~  |",
    "| | | |",
    "' ' ' '",
  ]),
  art('diamond', [
    "  /\\  ",
    " /  \\ ",
    " \\  / ",
    "  \\/  ",
  ]),
]

export const GALLERY_NAMES = GALLERY.map(g => g.name)
