import type { Palette, PaletteKey } from './types.js'

export const PALETTES: Record<PaletteKey, Palette> = {
  mono: {
    name: 'mono',
    label: 'mono',
    vibe: 'classic',
    fill: null,
    accent: 245,   // mid gray
    dim: 240,       // dark gray
  },
  ember: {
    name: 'ember',
    label: 'ember',
    vibe: 'warm glow',
    fill: 208,      // warm orange
    accent: 216,    // peach
    dim: 95,        // muted brown
  },
  arctic: {
    name: 'arctic',
    label: 'arctic',
    vibe: 'clean and cold',
    fill: 117,      // ice blue
    accent: 75,     // steel blue
    dim: 60,        // slate
  },
  sakura: {
    name: 'sakura',
    label: 'sakura',
    vibe: 'delicate',
    fill: 218,      // sakura pink
    accent: 175,    // dusty rose
    dim: 95,        // muted mauve
  },
  terminal: {
    name: 'terminal',
    label: 'terminal',
    vibe: 'hacker',
    fill: 46,       // bright green
    accent: 34,     // forest green
    dim: 22,        // dark green
  },
  sunset: {
    name: 'sunset',
    label: 'sunset',
    vibe: 'golden hour',
    fill: 220,      // gold
    accent: 209,    // coral
    dim: 130,       // burnt sienna
  },
  ultraviolet: {
    name: 'ultraviolet',
    label: 'ultraviolet',
    vibe: 'electric night',
    fill: 135,      // vivid purple
    accent: 199,    // hot magenta
    dim: 61,        // muted indigo
  },
  nessy: {
    name: 'nessy',
    label: 'nessy',
    vibe: 'vermillion',
    fill: 166,      // deep orange-red (#d75f00, closest to --spot #D95030)
    accent: 167,    // warm rose (#d75f5f)
    dim: 243,       // neutral gray
  },
  random: {
    name: 'random',
    label: 'random',
    vibe: 'rainbow',
    fill: null,     // triggers random header color pairs
    accent: 245,    // mid gray
    dim: 240,       // dark gray
  },
}

export const DEFAULT_PALETTE: PaletteKey = 'ember'

export const PALETTE_KEYS = Object.keys(PALETTES) as PaletteKey[]
