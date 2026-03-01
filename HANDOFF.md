# Clarissa — Handoff
_Last updated: 2026-02-28_

---

## What this is

**Clarissa** is a terminal companion. Two layers:

1. **Aesthetic layer** (`hey-clarissa` on npm) — pixel art icons, color palettes, font previews. Makes your terminal feel like yours.
2. **Character layer** (old `clarissa.sh`) — birth chart, astrology, daily moon guidance. A presence.

They're about to become one.

---

## Repo

```
~/cursorz/clarissa/
  packages/
    core/          — @clarissa/core (image processing, palette engine)
    cli/           — hey-clarissa npm package (the TypeScript CLI)
  clarissa.sh      — old astrology bash CLI (source of truth, do not delete)
  HANDOFF.md       — this file
```

## Published

- **npm**: `hey-clarissa@0.0.2` — includes `clarissa dir`
- **Binary**: `clarissa` (via npm global or alias)

---

## Current CLI commands (TypeScript, published)

| command | what it does |
|---|---|
| `clarissa` | welcome screen — icon, palette, command list |
| `clarissa add <file>` | convert PNG to pixel art icon |
| `clarissa preview <name>` | render icon to terminal |
| `clarissa list` | show all saved icons |
| `clarissa palette [name]` | switch color palette |
| `clarissa dir [path]` | set default image directory |
| `clarissa fonts` | preview figlet fonts |

## State

- `~/.clarissa/state.json` — stores `{ palette, icon, dir }`
- `~/.clarissa/icons/` — saved icon files
- `~/.clarissa/chart.conf` — **bash source file** with birth chart data (see below)

---

## Next priority: merge the astrology clarissa

### Goal

Port `clarissa.sh` features into the TypeScript CLI so there's **one `clarissa`**. The bash file goes away (but is preserved in the repo as `clarissa.sh` for historical record — do not delete it).

### What the old clarissa.sh has

**Commands:**
- `clarissa chart` — full natal chart (sun/moon/rising + all planets, signs, degrees)
- `clarissa me` — big three interpretations (sun core, moon core, rising core)
- `clarissa planets` — mercury through saturn interpretations
- `clarissa special` — stellium detection + elemental balance
- `clarissa daily` — daily guidance (moon phase + daily message + transits note)
- `clarissa advice <question>` — "can only answer about today" — moon-aware advice
- `clarissa manual` — interactive chart editor (arrow keys, select sign/degree for each planet)
- `clarissa setup` — setup wizard (separate `setup.sh`)
- `clarissa all` — full reading

**Interactive menu** (`clarissa` with no args in the bash version):
- Arrow key navigation
- Numbered hotkeys
- Cursor hiding (`tput civis`)

**Data model — `~/.clarissa/chart.conf`:**
```bash
USER_NAME="..."
BIRTH_DATE="..."
BIRTH_TIME="..."
BIRTH_PLACE="..."

SUN_SIGN="..."        SUN_DEGREE="..."
MOON_SIGN="..."       MOON_DEGREE="..."
RISING_SIGN="..."     RISING_DEGREE="..."
MERCURY_SIGN="..."    MERCURY_DEGREE="..."
VENUS_SIGN="..."      VENUS_DEGREE="..."
MARS_SIGN="..."       MARS_DEGREE="..."
JUPITER_SIGN="..."    JUPITER_DEGREE="..."
SATURN_SIGN="..."     SATURN_DEGREE="..."
URANUS_SIGN="..."     URANUS_DEGREE="..."
NEPTUNE_SIGN="..."    NEPTUNE_DEGREE="..."
PLUTO_SIGN="..."      PLUTO_DEGREE="..."
```

**Logic to port (pure functions, no deps):**
- Moon phase calculation (unix timestamp math, `lunar_cycle = 2551443`)
- Moon phase name + emoji (8 phases)
- Moon guidance text (8 phases)
- Current sun sign from date
- Sign data: element, traits, shadow, ruler (all 12 signs)
- Sun/Moon/Rising core interpretations (long-form text, all 12 signs)
- Mercury/Venus/Mars/Jupiter/Saturn interpretations
- Stellium detection (3+ planets in one sign)
- Elemental balance (fire/earth/air/water counts)
- Daily message rotation (day-of-year % message array)
- Seasonal transits note (month-based)
- Advice logic (moon phase → response, today-only gate)

### Suggested merge approach

**Step 1: Port chart data to TypeScript state**
- Add `chart?: ChartData` to `State` interface in `state.ts`
- `ChartData` mirrors `chart.conf`: user info + 11 planets × `{ sign, degree }`
- Keep reading/writing `chart.conf` in parallel for a transition period, OR just use `state.json` exclusively — your call
- Add `getChart()` / `setChart()` to `state.ts`

**Step 2: Create `src/astro/` module**
- Pure functions, no I/O
- `moon.ts` — phase calculation, name, emoji, guidance
- `signs.ts` — element, traits, shadow, ruler, core interpretations
- `chart.ts` — stellium detection, elemental balance, daily message, transits

**Step 3: Port commands one at a time**
Order: `chart` → `me` → `daily` → `advice` → `planets` → `special` → `manual`

Start with `chart` and `daily` because they're testable immediately once chart data exists.

**Step 4: Setup command**
- `clarissa setup` — interactive wizard to enter birth data + all 11 placements
- Write to `~/.clarissa/state.json`
- This replaces the old `setup.sh`

**Step 5: Integrate into welcome screen**
- If chart data exists: show daily message + moon phase in welcome
- Welcome becomes a true daily touchpoint

**Step 6: Handle the alias collision permanently**
- Once the TypeScript CLI handles all astrology commands, `clarissa.sh` can stop being the `clarissa` alias
- The alias source was never found in any config file — the new npm binary will just win once the bash script is removed from `~/.clarissa/`

---

## Known issues / unresolved

- **Alias source**: `alias clarissa='~/.clarissa/clarissa.sh'` is active in all shell sessions but its definition could not be found in `~/.zshrc`, `~/.zprofile`, `~/.zshenv`, `/etc/zshrc`, or any oh-my-zsh config. Workaround: `~/.clarissa/clarissa.sh` is restored from repo and works. The alias collision resolves naturally once the merge is done.
- **`clarissa.sh` is the current `clarissa`**: running `clarissa` with no args still launches the old astrology menu on this machine until the merge is done or the alias is removed.

---

## Pending beyond the merge

- **`clarissa shell`** — alias manager. Never started.
- **README GIF** — recording for GitHub. Never started.
- **npm publish** — will need 0.0.3+ after astrology commands are ported.

---

## Files to know

| file | purpose |
|---|---|
| `packages/cli/src/cli.ts` | command registration |
| `packages/cli/src/commands/welcome.ts` | default screen |
| `packages/cli/src/state.ts` | persistent state (add `chart` here) |
| `packages/cli/src/commands/add.ts` | image → icon |
| `packages/cli/src/commands/dir.ts` | default directory |
| `packages/cli/tsup.config.ts` | build config (no shebang banner — src already has it) |
| `clarissa.sh` | old bash CLI — port from here, keep forever |
| `~/.clarissa/chart.conf` | user's live chart data |
| `~/.clarissa/state.json` | palette, icon, dir |
