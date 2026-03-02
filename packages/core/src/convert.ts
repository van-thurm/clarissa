// Exact port of pixel_to_cli.py
// Algorithm: NEAREST resize (caller's responsibility), composite onto white
// (caller's responsibility), brightness threshold 128 → filled or empty.

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
 * Convert raw RGB pixel data to icon rows.
 * Input: flat Uint8Array of RGB bytes (3 bytes per pixel, no alpha),
 * already resized to size×size and composited onto white.
 * Output: array of strings, one per row.
 */
export function pixelsToRows(rgb: Uint8Array, size: number): string[] {
  const rows: string[] = []

  for (let y = 0; y < size; y++) {
    let row = ''
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 3
      const brightness = (rgb[i] + rgb[i + 1] + rgb[i + 2]) / 3
      row += brightness < THRESHOLD ? FILLED : EMPTY
    }
    rows.push(row)
  }

  return rows
}
