import type { Palette, PaletteKey } from './types.js'

export const PALETTES: Record<PaletteKey, Palette> = {
  mono: {
    name: 'mono',
    label: 'Mono',
    vibe: 'classic, default',
    color: null,
  },
  ghost: {
    name: 'ghost',
    label: 'Ghost',
    vibe: 'soft and warm',
    color: 252,  // #d0d0d0 — muted warm gray
  },
  neon: {
    name: 'neon',
    label: 'Neon',
    vibe: 'punchy, high contrast',
    color: 51,   // #00ffff — electric cyan
  },
  sakura: {
    name: 'sakura',
    label: 'Sakura',
    vibe: 'delicate',
    color: 218,  // #ffafd7 — sakura pink
  },
  forest: {
    name: 'forest',
    label: 'Forest',
    vibe: 'grounded',
    color: 28,   // #008700 — deep forest green
  },
  sunset: {
    name: 'sunset',
    label: 'Sunset',
    vibe: 'warm and bold',
    color: 208,  // #ff8700 — warm orange
  },
  electric: {
    name: 'electric',
    label: 'Electric',
    vibe: 'loud',
    color: 199,  // #ff00af — bright magenta
  },
  ocean: {
    name: 'ocean',
    label: 'Ocean',
    vibe: 'deep and calm',
    color: 33,   // #0087ff — deep blue
  },
  candy: {
    name: 'candy',
    label: 'Candy',
    vibe: 'sweet and hot',
    color: 213,  // #ff87ff — hot pink
  },
  gold: {
    name: 'gold',
    label: 'Gold',
    vibe: 'rich',
    color: 220,  // #ffd700 — warm gold
  },
  lavender: {
    name: 'lavender',
    label: 'Lavender',
    vibe: 'dreamy',
    color: 141,  // #af87ff — soft purple
  },
}

export const DEFAULT_PALETTE: PaletteKey = 'mono'

export const PALETTE_KEYS = Object.keys(PALETTES) as PaletteKey[]
