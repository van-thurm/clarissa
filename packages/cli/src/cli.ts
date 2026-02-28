#!/usr/bin/env node
import { Command } from 'commander'
import { PALETTE_KEYS } from '@clarissa/core'
import type { PaletteKey } from '@clarissa/core'
import { add } from './commands/add.js'
import { preview } from './commands/preview.js'
import { list } from './commands/list.js'
import { palette } from './commands/palette.js'
import { welcome } from './commands/welcome.js'

const program = new Command()

program
  .name('clarissa')
  .description('make your terminal feel like yours')
  .version('0.0.1')

program
  .command('add <file>')
  .description('convert pixel art, save as icon')
  .option('-n, --name <name>', 'icon name (default: filename)')
  .option('-s, --size <size>', 'pixel size (default: 32)', parseInt)
  .action(async (file: string, opts: { name?: string; size?: number }) => {
    await add(file, opts).catch(err => {
      console.error(`\n  error: ${err.message}\n`)
      process.exit(1)
    })
  })

program
  .command('preview <name>')
  .description('print icon to terminal')
  .option('-p, --palette <palette>', `palette (${PALETTE_KEYS.join(', ')})`)
  .action(async (name: string, opts: { palette?: string }) => {
    await preview(name, { palette: opts.palette as PaletteKey | undefined }).catch(err => {
      console.error(`\n  error: ${err.message}\n`)
      process.exit(1)
    })
  })

program
  .command('list')
  .description('show all saved icons')
  .action(async () => {
    await list().catch(err => {
      console.error(`\n  error: ${err.message}\n`)
      process.exit(1)
    })
  })

program
  .command('palette [name]')
  .description('list palettes or set active palette')
  .action(async (name?: string) => {
    await palette(name).catch(err => {
      console.error(`\n  error: ${err.message}\n`)
      process.exit(1)
    })
  })

// Show welcome screen when no subcommand is given
program.action(async () => {
  await welcome().catch(err => {
    console.error(`\n  error: ${err.message}\n`)
    process.exit(1)
  })
})

program.parse()
