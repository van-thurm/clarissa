import { listIcons } from '../store.js'

export async function list(): Promise<void> {
  const icons = await listIcons()

  if (icons.length === 0) {
    console.log('\n  no icons yet\n')
    console.log('  clarissa add <file.png>\n')
    return
  }

  console.log()
  for (const name of icons) {
    console.log(`  ${name}`)
  }
  console.log()
}
