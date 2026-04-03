import path from 'path'
import os from 'os'
import fs from 'fs/promises'

export const HOME         = os.homedir()
export const CLARISSA_DIR = path.join(HOME, '.clarissa')
export const SHELLS_FILE  = path.join(CLARISSA_DIR, 'shells.sh')
export const ICONS_DIR    = path.join(CLARISSA_DIR, 'icons')
export const ZSHRC        = path.join(HOME, '.zshrc')

export function bashEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$')
}

export function isValidName(name: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)
}

export async function ensureShellsFile(): Promise<void> {
  await fs.mkdir(CLARISSA_DIR, { recursive: true })
  try { await fs.access(SHELLS_FILE) }
  catch { await fs.writeFile(SHELLS_FILE, '# clarissa jam — custom shell commands\n\n') }
}

export async function ensureZshrcSourced(): Promise<boolean> {
  const mark = 'source ~/.clarissa/shells.sh'
  let content = ''
  try { content = await fs.readFile(ZSHRC, 'utf-8') } catch { /* no .zshrc yet */ }
  if (content.includes(mark)) return false
  await fs.appendFile(ZSHRC, `\n# clarissa\n${mark}\n`)
  return true
}
