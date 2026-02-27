// Exact port of pixel_to_cli.py
// Algorithm: NEAREST resize (caller's responsibility), composite onto white
// (caller's responsibility), brightness threshold 128 → filled or empty.

const FILLED = '\u2588\u2588'  // ██  U+2588 FULL BLOCK × 2
const EMPTY = '  '             // 2 spaces — correct aspect ratio in monospace fonts
const THRESHOLD = 128

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
