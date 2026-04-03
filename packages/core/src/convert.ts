// Pixel-to-terminal conversion with Floyd-Steinberg dithering.
// Caller resizes and composites onto white before passing RGB data here.

const FILLED = '\u2588\u2588'  // ██  U+2588 FULL BLOCK × 2
const EMPTY = '  '             // 2 spaces — correct aspect ratio in monospace fonts
const THRESHOLD = 128

/**
 * Resize existing icon rows to a new size using nearest-neighbor sampling.
 * Works from stored row data — no original file needed.
 */
export function resizeRows(rows: string[], fromSize: number, toSize: number): string[] {
  if (fromSize === toSize) return rows

  // Parse rows back to a boolean grid (true = filled block)
  const grid: boolean[][] = rows.map(row => {
    const pixels: boolean[] = []
    for (let x = 0; x < fromSize; x++) {
      pixels.push(row[x * 2] === FILLED[0])
    }
    return pixels
  })

  // Nearest-neighbor resample to target size
  const resized: boolean[][] = []
  for (let y = 0; y < toSize; y++) {
    const srcY = Math.floor(y * fromSize / toSize)
    const row: boolean[] = []
    for (let x = 0; x < toSize; x++) {
      const srcX = Math.floor(x * fromSize / toSize)
      row.push(grid[srcY]?.[srcX] ?? false)
    }
    resized.push(row)
  }

  return resized.map(row => row.map(p => p ? FILLED : EMPTY).join(''))
}

/**
 * Convert raw RGB pixel data to icon rows using Floyd-Steinberg dithering.
 * Input: flat Uint8Array of RGB bytes (3 bytes per pixel, no alpha),
 * already resized to size×size and composited onto white.
 * Output: array of strings, one per row.
 */
export function pixelsToRows(rgb: Uint8Array, size: number): string[] {
  const buf = new Float64Array(size * size)
  for (let i = 0; i < size * size; i++) {
    buf[i] = (rgb[i * 3] + rgb[i * 3 + 1] + rgb[i * 3 + 2]) / 3
  }

  const rows: string[] = []
  for (let y = 0; y < size; y++) {
    let row = ''
    for (let x = 0; x < size; x++) {
      const idx = y * size + x
      const old = buf[idx]
      const filled = old < THRESHOLD
      const err = old - (filled ? 0 : 255)

      row += filled ? FILLED : EMPTY

      if (x + 1 < size)                    buf[idx + 1]        += err * 7 / 16
      if (y + 1 < size && x > 0)           buf[idx + size - 1] += err * 3 / 16
      if (y + 1 < size)                    buf[idx + size]     += err * 5 / 16
      if (y + 1 < size && x + 1 < size)    buf[idx + size + 1] += err * 1 / 16
    }
    rows.push(row)
  }

  return rows
}
