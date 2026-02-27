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
}

export const DEFAULT_PALETTE: PaletteKey = 'mono'

export const PALETTE_KEYS = Object.keys(PALETTES) as PaletteKey[]
