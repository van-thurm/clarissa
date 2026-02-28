import fs from 'fs/promises'
import path from 'path'
import { getActiveDir, setActiveDir } from '../state.js'

export async function dir(dirPath?: string): Promise<void> {
  if (!dirPath) {
    const current = await getActiveDir()
    if (current) {
      console.log(`\n  ${current}\n`)
    } else {
      console.log(`\n  no directory set — run: clarissa dir <path>\n`)
    }
    return
  }

  const resolved = path.resolve(dirPath.replace(/^~/, process.env.HOME ?? '~'))

  const stat = await fs.stat(resolved).catch(() => null)
  if (!stat || !stat.isDirectory()) {
    throw new Error(`Not a directory: ${resolved}`)
  }

  await setActiveDir(resolved)
  console.log(`\n  dir  ${resolved}\n`)
}
