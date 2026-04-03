export type PaletteKey = 'mono' | 'ember' | 'arctic' | 'sakura' | 'terminal' | 'sunset' | 'ultraviolet'

export interface Palette {
  name: PaletteKey
  label: string
  vibe: string
  fill: number | null    // icon blocks — null = default terminal foreground
  accent: number         // dividers, menu letters, active indicators
  dim: number            // subtle text, hints, secondary info
}

export interface Icon {
  name: string
  source: string  // original filename or 'built-in'
  size: number    // logical pixels (32 = 32×32), 0 for character art
  rows: string[]  // block art: ██ and spaces; character art: any printable chars
  created: string // ISO timestamp
}
