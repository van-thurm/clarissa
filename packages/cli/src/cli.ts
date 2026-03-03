#!/usr/bin/env node
import { Command } from 'commander'
import { PALETTE_KEYS } from '@clarissa/core'
import type { PaletteKey } from '@clarissa/core'
import { add } from './commands/add.js'
import { preview } from './commands/preview.js'
import { list } from './commands/list.js'
import { palette } from './commands/palette.js'
import { welcome } from './commands/welcome.js'
import { fonts } from './commands/fonts.js'
import { dir } from './commands/dir.js'
import { setup } from './commands/setup.js'
import { chart } from './commands/chart.js'
import { me } from './commands/me.js'
import { daily } from './commands/daily.js'
import { advice } from './commands/advice.js'
import { crafts } from './commands/crafts.js'
import { jam } from './commands/jam.js'

const program = new Command()

program
  .name('clarissa')
  .description('make your terminal feel like yours')
  .version('0.0.1')

program
  .command('add <file>')
  .description('convert pixel art, save as icon')
  .option('-n, --name <name>', 'icon name (default: filename)')
  .option('-s, --size <size>', 'size: small (16), medium (32), large (64), or a pixel count')
  .action(async (file: string, opts: { name?: string; size?: string }) => {
    await add(file, opts).catch(err => {
      console.error(`\n  error: ${err.message}\n`)
      process.exit(1)
    })
  })

program
  .command('preview <name>')
  .description('print icon to terminal')
  .option('-p, --palette <palette>', `palette (${PALETTE_KEYS.join(', ')})`)
  .option('-s, --size <size>', 'display size: small (16), medium (32), large (64), or a pixel count')
  .action(async (name: string, opts: { palette?: string; size?: string }) => {
    await preview(name, { palette: opts.palette as PaletteKey | undefined, size: opts.size }).catch(err => {
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

program
  .command('fonts [name]')
  .description('list fonts or preview a font')
  .option('-t, --text <text>', 'custom sample text')
  .option('-a, --all', 'show all available fonts')
  .option('-s, --scale <n>', 'scale factor for block fonts (2 or 3)', parseInt)
  .action(async (name?: string, opts: { text?: string; all?: boolean; scale?: number } = {}) => {
    await fonts(name, opts.text, opts.all, opts.scale).catch(err => {
      console.error(`\n  error: ${err.message}\n`)
      process.exit(1)
    })
  })

program
  .command('dir [path]')
  .description('set default image directory for add')
  .action(async (dirPath?: string) => {
    await dir(dirPath).catch(err => {
      console.error(`\n  error: ${err.message}\n`)
      process.exit(1)
    })
  })

program
  .command('setup')
  .description('set up your natal chart')
  .action(async () => {
    await setup().catch(err => {
      console.error(`\n  error: ${err.message}\n`)
      process.exit(1)
    })
  })

program
  .command('chart')
  .description('show your natal chart')
  .action(async () => {
    await chart().catch(err => {
      console.error(`\n  error: ${err.message}\n`)
      process.exit(1)
    })
  })

program
  .command('me')
  .description('big three interpretations')
  .action(async () => {
    await me().catch(err => {
      console.error(`\n  error: ${err.message}\n`)
      process.exit(1)
    })
  })

program
  .command('daily')
  .description('daily reading: moon phase + guidance')
  .action(async () => {
    await daily().catch(err => {
      console.error(`\n  error: ${err.message}\n`)
      process.exit(1)
    })
  })

program
  .command('advice <question...>')
  .description('moon-aware advice for today')
  .action(async (question: string[]) => {
    await advice(question.join(' ')).catch(err => {
      console.error(`\n  error: ${err.message}\n`)
      process.exit(1)
    })
  })

program
  .command('crafts')
  .description('pixel art, fonts, and shell command tools')
  .action(async () => {
    await crafts().catch(err => {
      console.error(`\n  error: ${err.message}\n`)
      process.exit(1)
    })
  })

program
  .command('jam')
  .description('make a new shell command')
  .action(async () => {
    await jam().catch(err => {
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
