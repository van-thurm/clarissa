# Clarissa

> make your terminal feel like yours.

Clarissa is a terminal companion for designers who code. She's a pit stop — somewhere to check in before a dev session, get a git summary, pull a horoscope, or just add something a little analog to a day spent in the terminal.

---

## Install

```bash
npm install -g hey-clarissa
```

```bash
clarissa
```

---

## What's here

| Path | What it is |
|---|---|
| `clarissa.sh` | Full bash CLI — interactive menu, astrology, fonts |
| `calculate.sh` | Meeus astronomical algorithms (Julian dates, planet positions) |
| `setup.sh` | Setup wizard |
| `install.sh` | curl installer |
| `fonts/` | 6 ASCII art fonts |
| `pipeline/` | Pixel art → terminal icon converter |
| `packages/core` | Shared TypeScript: pixel conversion, palette system |
| `packages/cli` | npm package (`hey-clarissa`) |
| `packages/figma-plugin` | Figma plugin (stub — not yet built) |

---

## Commands

Run `clarissa` with no arguments to see the welcome screen, or use a command:

| Command | What it does |
|---|---|
| `clarissa` | welcome screen |
| `clarissa setup` | set up your natal chart |
| `clarissa chart` | show your natal chart |
| `clarissa me` | big three interpretations |
| `clarissa daily` | daily reading: moon phase + guidance |
| `clarissa advice <question>` | moon-aware advice for today |
| `clarissa special-report` | your stats: git, claude, open tasks |
| `clarissa add <file>` | convert pixel art, save as icon |
| `clarissa preview <name>` | print icon to terminal |
| `clarissa list` | show all saved icons |
| `clarissa palette [name]` | list palettes or set active palette |
| `clarissa fonts [name]` | list fonts or preview a font |
| `clarissa dir [path]` | set default image directory |
| `clarissa crafts` | pixel art, fonts, and shell command tools |
| `clarissa jam` | make a new shell command |

---

*clarissa is always learning how to do new things to impress terminal users.*
