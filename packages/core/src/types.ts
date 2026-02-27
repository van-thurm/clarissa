export type PaletteKey = 'mono' | 'ghost' | 'neon' | 'sakura' | 'forest'

export interface Palette {
  name: PaletteKey
  label: string
  vibe: string
  color: number | null  // ANSI 256-color code; null = mono (no color wrapping)
}

export interface Icon {
  name: string
  source: string  // original filename
  size: number    // logical pixels (32 = 32×32)
  rows: string[]  // palette-independent: ██ and spaces only
  created: string // ISO timestamp
}
