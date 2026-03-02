import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    external: ['sharp', 'commander', 'figlet', 'readline/promises'],
  },
  {
    entry: { cli: 'src/cli.ts' },
    format: ['cjs'],
    dts: false,
    external: ['sharp', 'commander', 'figlet', 'readline/promises'],
  },
])
