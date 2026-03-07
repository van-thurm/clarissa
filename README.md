# clarissa

> make your terminal feel like yours.

clarissa is a terminal companion for designers who code. somewhere to check in before jumping into code, to get a git summary, or maybe something dumber. the figlet based ascii art you create in clarissa can be used in terminal based ui design. 

named after clarissa darling - from ohio, into computers, explained it all.  

---

## install

```bash
npm install -g hey-clarissa
```

```bash
clarissa
```

---

## what's here

| path | what it is |
|---|---|
| `clarissa.sh` | full bash CLI — interactive menu, astrology, fonts |
| `calculate.sh` | meeus astronomical algorithms (julian dates, planet positions) |
| `setup.sh` | setup wizard - connect your info |
| `install.sh` | curl installer |
| `fonts/` | 6 ASCII art fonts |
| `pipeline/` | pixel art → terminal icon converter |
| `packages/core` | shared typeScript: pixel conversion, palette system |
| `packages/cli` | npm package (`hey-clarissa`) |
| `packages/figma-plugin` | figma plugin (stub — not yet built) |

---

## commands

run `clarissa` with no arguments to see the welcome screen, or use a command:

| command | what it does |
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

