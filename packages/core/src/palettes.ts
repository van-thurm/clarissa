import type { Palette, PaletteKey } from './types.js'

export const PALETTES: Record<PaletteKey, Palette> = {
  mono: {
    name: 'mono',
    label: 'Mono',
    vibe: 'classic',
    fill: null,
    accent: 245,   // mid gray
    dim: 240,       // dark gray
  },
  ember: {
    name: 'ember',
    label: 'Ember',
    vibe: 'warm glow',
    fill: 208,      // warm orange
    accent: 216,    // peach
    dim: 95,        // muted brown
  },
  arctic: {
    name: 'arctic',
    label: 'Arctic',
    vibe: 'clean and cold',
    fill: 117,      // ice blue
    accent: 75,     // steel blue
    dim: 60,        // slate
  },
  sakura: {
    name: 'sakura',
    label: 'Sakura',
    vibe: 'delicate',
    fill: 218,      // sakura pink
    accent: 175,    // dusty rose
    dim: 95,        // muted mauve
  },
  terminal: {
    name: 'terminal',
    label: 'Terminal',
    vibe: 'hacker',
    fill: 46,       // bright green
    accent: 34,     // forest green
    dim: 22,        // dark green
  },
  sunset: {
    name: 'sunset',
    label: 'Sunset',
    vibe: 'golden hour',
    fill: 220,      // gold
    accent: 209,    // coral
    dim: 130,       // burnt sienna
  },
  ultraviolet: {
    name: 'ultraviolet',
    label: 'Ultraviolet',
    vibe: 'electric night',
    fill: 135,      // vivid purple
    accent: 199,    // hot magenta
    dim: 61,        // muted indigo
  },
}

export const DEFAULT_PALETTE: PaletteKey = 'ember'

export const PALETTE_KEYS = Object.keys(PALETTES) as PaletteKey[]
