import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import * as readline from 'readline/promises'
import { getMoonPhase, getMoonPhaseName, getMoonPhaseSymbol } from '../astro/moon.js'
import { getReposDir } from '../state.js'

import { loadTheme, RESET, BOLD } from '../theme.js'

let DIM = '', ACCENT = ''
function hr(): string { return `  ${ACCENT}${'━'.repeat(49)}${RESET}` }

// ── git stats ─────────────────────────────────────────────────────────────────

function gitExec(cmd: string, cwd: string): string {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
  } catch {
    return ''
  }
}

function findGitRepos(base: string): string[] {
  try {
    return fs.readdirSync(base, { withFileTypes: true })
      .filter(d => d.isDirectory() && fs.existsSync(path.join(base, d.name, '.git')))
      .map(d => path.join(base, d.name))
  } catch {
    return []
  }
}

function getGitStats(repos: string[]) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const weekAgoStr = weekAgo.toISOString().split('T')[0]

  let allDates: string[] = []
  const extCounts: Record<string, number> = {}
  const activeProjects: string[] = []
  const commitHours: number[] = []

  for (const repo of repos) {
    const dates = gitExec(
      `git log --since="${weekAgoStr}" --format="%ad" --date=format:"%Y-%m-%d"`,
      repo
    )
    if (!dates) continue

    activeProjects.push(path.basename(repo))
    allDates = allDates.concat(dates.split('\n').filter(Boolean))

    // Commit hours for timing sentence (last 30 days)
    const hours = gitExec(
      `git log --since="30 days ago" --format="%ad" --date=format:"%H"`,
      repo
    )
    for (const h of hours.split('\n').filter(Boolean)) {
      commitHours.push(parseInt(h))
    }

    const files = gitExec(
      `git log --since="${weekAgoStr}" --name-only --pretty=format:""`,
      repo
    )
    for (const f of files.split('\n').filter(Boolean)) {
      const ext = path.extname(f).toLowerCase()
      if (ext) extCounts[ext] = (extCounts[ext] ?? 0) + 1
    }
  }

  // Streak: consecutive days with commits ending today or yesterday
  const uniqueDates = new Set(allDates)
  let streak = 0
  // Check 14 days back for the streak
  const allDates14 = repos.flatMap(repo => {
    const d = gitExec(`git log --since="14 days ago" --format="%ad" --date=format:"%Y-%m-%d"`, repo)
    return d ? d.split('\n').filter(Boolean) : []
  })
  const uniqueDates14 = new Set(allDates14)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const cursor = new Date(today)
  while (true) {
    const s = cursor.toISOString().split('T')[0]
    if (uniqueDates14.has(s)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }

  // File type label
  const frontendExts = new Set(['.tsx', '.jsx', '.css', '.scss', '.svg', '.html', '.vue'])
  const logicExts    = new Set(['.ts', '.js', '.go', '.py', '.rb', '.rs'])
  let frontendN = 0, logicN = 0
  for (const [ext, n] of Object.entries(extCounts)) {
    if (frontendExts.has(ext)) frontendN += n
    else if (logicExts.has(ext)) logicN += n
  }
  const topExts = Object.entries(extCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([e]) => e).join(' ')
  const total = frontendN + logicN
  let fileLabel = topExts ? `mixed week  —  ${topExts}` : 'mixed week'
  if (total > 0) {
    if (frontendN / total > 0.55) fileLabel = `heavy frontend week  —  ${topExts}`
    else if (logicN / total > 0.55) fileLabel = `logic and config week  —  ${topExts}`
    else if (topExts) fileLabel = `full-stack week  —  ${topExts}`
  }

  // Peak commit hour
  let timingSentence = ''
  if (commitHours.length >= 5) {
    const hourBuckets: Record<number, number> = {}
    for (const h of commitHours) hourBuckets[h] = (hourBuckets[h] ?? 0) + 1
    const peakH = parseInt(Object.entries(hourBuckets).sort((a, b) => b[1] - a[1])[0][0])
    const ampm = peakH >= 12 ? 'pm' : 'am'
    const h12 = peakH > 12 ? peakH - 12 : peakH === 0 ? 12 : peakH
    timingSentence = `peak commit time: ${h12}${ampm}`
  }

  // Commits per day of current week (Mon=0 … Sun=6)
  const todayDow = (today.getDay() + 6) % 7
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - todayDow)
  weekStart.setHours(0, 0, 0, 0)
  const commitsByDay = [0, 0, 0, 0, 0, 0, 0]
  for (const d of allDates) {
    const date = new Date(d + 'T12:00:00')
    if (date >= weekStart) {
      const dow = (date.getDay() + 6) % 7
      commitsByDay[dow]++
    }
  }

  return {
    commits: allDates.length,
    streak,
    fileLabel,
    activeProjects: [...new Set(activeProjects)],
    timingSentence,
    commitsByDay,
  }
}

// ── commit bars ───────────────────────────────────────────────────────────────

function renderBars(commitsByDay: number[], todayDow: number): void {
  const labels = ['m', 't', 'w', 't', 'f', 's', 's']
  const maxVal = Math.max(...commitsByDay, 1)
  const MAX_BARS = 12

  for (let i = 0; i < 7; i++) {
    const count     = commitsByDay[i]
    const isFuture  = i > todayDow
    const isToday   = i === todayDow

    let bar: string
    if (isFuture || count === 0) {
      bar = `${DIM}░${RESET}`
    } else {
      const barLen = Math.max(1, Math.round((count / maxVal) * MAX_BARS))
      bar = `${ACCENT}${'▌'.repeat(barLen)}${RESET}`
    }

    const marker = isToday ? `  ${DIM}←${RESET}` : ''
    console.log(`  ${DIM}${labels[i]}${RESET}  ${bar}${marker}`)
  }
}

// ── open tasks ────────────────────────────────────────────────────────────────

function parseHandoffTasks(content: string): string[] {
  const lines = content.split('\n')
  const tasks: string[] = []
  let inSection = false

  for (const line of lines) {
    const l = line.trim()
    if (l.startsWith('#')) {
      const lower = l.toLowerCase()
      inSection = /carry.?forward|next.?step|open.?item|known.?bug|needs.?qa|carry forward|to.?do/.test(lower)
      continue
    }
    if (inSection && /^[-*]\s/.test(l)) {
      const task = l.replace(/^[-*]\s+/, '').replace(/^\[.\]\s*/, '').trim()
      if (task.length > 3 && task.length < 120) tasks.push(task)
    }
  }
  return tasks.slice(0, 3)
}

function getOpenTasks(base: string) {
  // Collect all tasks per project (merge across multiple handoff files)
  const byProject: Record<string, Set<string>> = {}
  try {
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const dir = path.join(base, entry.name)
      try {
        const handoffs = fs.readdirSync(dir).filter(
          f => f.startsWith('RESUMESESSION_HANDOFF') && f.endsWith('.md')
        )
        for (const file of handoffs) {
          const content = fs.readFileSync(path.join(dir, file), 'utf-8')
          const tasks = parseHandoffTasks(content)
          if (!byProject[entry.name]) byProject[entry.name] = new Set()
          for (const t of tasks) byProject[entry.name].add(t)
        }
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  return Object.entries(byProject)
    .filter(([, tasks]) => tasks.size > 0)
    .map(([project, taskSet]) => ({
      project,
      // Trim long tasks, skip "None" or very short entries
      tasks: [...taskSet]
        .filter(t => t.toLowerCase() !== 'none' && t.length > 8)
        .map(t => t.length > 52 ? t.slice(0, 49) + '…' : t)
        .slice(0, 3),
    }))
    .filter(p => p.tasks.length > 0)
}

// ── today signal ──────────────────────────────────────────────────────────────

const TODAY_POOL = [
  // — terminal essentials —
  'cd -  go back to the previous directory',
  'open .  open current directory in Finder',
  'pbcopy / pbpaste  clipboard in terminal (e.g. cat file | pbcopy)',
  'ctrl+r  reverse search command history',
  'ctrl+l  clear the screen',
  'ctrl+a / ctrl+e  jump to start / end of line',
  'ctrl+u  delete to start of line',
  'ctrl+k  delete to end of line',
  'tab  autocomplete -- double-tap for options',
  '!!  repeat last command',
  'cmd+k  clear scrollback in macOS terminal',
  'caffeinate  prevent Mac from sleeping during long processes',
  'say "done"  macOS text-to-speech -- useful after long builds',
  'which <cmd>  show where a command lives',
  'option+click  jump cursor in most terminals',
  'ctrl+c  cancel current command',
  '> file  redirect output to file -- >> to append',
  '| tee file  pipe to screen AND save to file',
  'reset  fix a garbled terminal display',
  'history | grep <term>  search past commands by keyword',

  // — git —
  'git status  before anything -- know your state',
  'git diff --staged  review what you\'re about to commit',
  'git stash  save work without committing -- git stash pop to restore',
  'git log --oneline --graph  see your branch history at a glance',
  'git branch -d <name>  delete a branch after merging',
  'git checkout -b <name>  create and switch to a new branch',
  'git reflog  your safety net -- recent actions recoverable for weeks',
  'git diff origin/main  compare your branch to main before a PR',
  'git show HEAD  review the last commit in full',
  'git blame <file>  see who changed each line',
  'git cherry-pick <hash>  move one commit to another branch',
  'git tag v1.0.0  tag a release -- makes rollback easy',
  'git bisect  binary search to find the commit that broke something',
  'commit often -- a commit is a checkpoint, not a finished product',
  'keep commits small and focused on one change',
  'write commit messages in imperative mood: "fix bug" not "fixed bug"',
  'never commit secrets -- use environment variables and .env files',
  '.gitignore is a first-class file -- write it early',
  'pull before you push -- avoid unnecessary merge conflicts',
  'use branches for everything -- even experiments',

  // — clarissa —
  'clarissa crafts  is the main menu for art, fonts, jams, and palettes',
  'clarissa jam  creates a custom shell command you can run anywhere',
  'clarissa palette  changes the color theme across all clarissa output',
  'clarissa fonts <name>  previews any installed figlet font',
  'clarissa fonts  lists all available ASCII fonts by category',
  'clarissa daily  gives you a moon phase reading and guidance',
  'clarissa advice <question>  gives moon-aware advice for today',
  'clarissa me  shows your big three interpretations (sun/moon/rising)',
  'clarissa add <file>  converts any image to pixel art',
  'clarissa list  shows all your saved art',
  'clarissa preview <name>  prints a saved icon to the terminal',
  'clarissa special-report  shows git stats, tasks, and streaks',
  'you can set art as your terminal startup graphic in the art menu',
  'jams can include a font header, an icon, and a shell command',
  'you can rename or delete jams from the crafts menu',
  'drag a file from Finder into the terminal to paste its path',
  'the --size flag on clarissa add sets pixel density: 8 or 16',
  'your palette affects how all art renders -- try a few',
  'art made in clarissa is stored in ~/.clarissa/icons/',
  'your settings live in ~/.clarissa/state.json',
  'clarissa setup  configures your natal chart for daily readings',

  // — macOS power user —
  'open -a "App Name"  launch any app from terminal',
  'open -a Preview <file>  open an image in Preview from terminal',
  'open https://...  open a URL in your default browser',
  'defaults write com.apple.Finder AppleShowAllFiles true  show hidden files in Finder',
  'screenshot: cmd+shift+4 then drag to capture a region',
  'screenshot: cmd+shift+5 opens the screenshot toolbar with recording',
  'cmd+space  Spotlight -- launch apps, search files, do math',
  'cmd+option+d  toggle Dock auto-hide',
  'cmd+shift+.  toggle hidden files in Finder open/save dialogs',
  'quick look: select a file in Finder and press space to preview',
  'mdfind <term>  Spotlight search from the terminal',
  'mdls <file>  show all metadata for a file',
  'sips --resampleWidth 800 image.png  resize an image from terminal',
  'qlmanage -p <file>  Quick Look preview from terminal',
  'networkQuality  run an internet speed test from terminal (macOS 12+)',
  'textutil -convert html doc.docx  convert document formats',
  'ditto -V source dest  copy files preserving metadata',
  'diskutil list  see all mounted drives and partitions',
  'softwareupdate -l  check for macOS updates from terminal',
  'pmset -g batt  check battery status from terminal',

  // — design and creative —
  'pixel art tip: start with 8x8 -- constraints force better design choices',
  'color reduces: strong pixel art often works in just 2-3 colors',
  'the best terminal art uses whitespace as a design element',
  'ASCII art history: it started in the 1960s on teletypes before screens existed',
  'figlet fonts were created in 1991 -- the name stands for "Frank, Ian, and Glenn\'s letters"',
  'pixel art tip: avoid anti-aliasing -- hard edges are the whole point',
  'Susan Kare\'s original Mac icons were 32x32 pixels -- every pixel deliberate',
  'the Unicode block character (U+2588) is the building block of terminal pixel art',
  'terminal art constraint: most terminals are 80 columns -- design within that',
  'good pixel art reads at a glance -- if you have to squint, simplify',
  'Braille characters (U+2800-U+28FF) can create higher-resolution terminal graphics',
  'pixel art tip: start with the silhouette, then add internal detail',
  'fonts can change the whole mood -- try slant for drama, small for subtlety',
  'icon design rule: if it doesn\'t read at the smallest size, the shape isn\'t clear enough',
  'the original Game Boy screen was 160x144 pixels -- a masterclass in constraint',
  'mosaic art (like terminal pixel art) dates back to ancient Mesopotamia',
  'Eboy pioneered the isometric pixel art style used in countless games and illustrations',
  'design tip: leave your work, come back tomorrow -- you\'ll see it fresh',
  'creative constraint: try designing with only one font and one icon per jam',
  'terminal art looks different on every machine -- test on a dark and light background',

  // — workflow and productivity —
  'mkdir -p path/to/deep/folder  creates the full path in one command',
  'ls -la  shows hidden files with sizes and permissions',
  'du -sh *  shows how much disk space each item uses',
  'find . -name "*.png" -mtime -7  find PNGs modified in the last week',
  'wc -l <file>  count lines in a file',
  'diff file1 file2  compare two files line by line',
  'tree -L 2  visualize directory structure (install with brew install tree)',
  'alias  by itself lists all your current aliases',
  'put your most-used aliases in .zshrc -- they load on every new shell',
  'xargs turns piped input into arguments: find . -name "*.tmp" | xargs rm',
  'curl -I <url>  check HTTP headers without downloading the page',
  'tar -czf archive.tar.gz folder/  compress a folder',
  'tar -xzf archive.tar.gz  extract an archive',
  'ln -s target link  create a symbolic link',
  'chmod +x script.sh  make a script executable',

  // — women in computer engineering history —
  'Ada Lovelace wrote what is considered the first algorithm intended for a machine — in 1843, for a computer that hadn\'t been built yet.',
  'Grace Hopper invented the first compiler in 1952, translating human-readable code into machine language for the first time.',
  'Grace Hopper popularized the term "debugging" after a moth was found in a relay of the Harvard Mark II in 1947.',
  'Katherine Johnson\'s orbital mechanics calculations for Project Mercury were so trusted, John Glenn refused to fly until she personally verified the computer\'s numbers.',
  'Dorothy Vaughan became NASA\'s first Black supervisor in 1949 and taught herself and her team FORTRAN before the agency\'s human computers were replaced by machines.',
  'Mary Jackson was NASA\'s first Black female engineer, petitioning a Virginia court to attend segregated classes needed for her engineering credentials.',
  'The women of ENIAC — Jean Jennings Bartik, Frances Bilas Spence, Betty Holberton, and others — programmed the world\'s first general-purpose electronic computer in 1945, then went largely unrecognized for decades.',
  'Betty Holberton developed the first statistical analysis software package and co-designed the COBOL and FORTRAN standards.',
  'Jean Sammet was one of the developers of COBOL, a programming language still running billions of dollars of financial transactions today.',
  'Hedy Lamarr — yes, the actress — co-invented frequency-hopping spread spectrum in 1942, a concept now fundamental to Wi-Fi, GPS, and Bluetooth.',
  'Radia Perlman invented the Spanning Tree Protocol (STP) in 1985, making modern ethernet networks possible. She\'s sometimes called the "Mother of the Internet."',
  'Frances Allen became IBM\'s first female Fellow in 1989 and won the Turing Award in 2006 for foundational work in compiler optimization.',
  'Adele Goldberg co-developed Smalltalk-80 at Xerox PARC — the language that introduced object-oriented programming to the world.',
  'Susan Kare designed the original Macintosh icons and typefaces in 1984 — the trash can, the command symbol, Chicago font — things you still see echoes of today.',
  'Lynn Conway revolutionized VLSI chip design in the 1970s, her methods now used in almost every chip ever made since.',
  'Sophie Wilson designed the ARM instruction set architecture in 1983 — the ISA powering the vast majority of mobile devices on the planet today.',
  'Rear Admiral Grace Hopper received the Presidential Medal of Freedom posthumously in 2016. The USS Hopper destroyer is named after her.',
  'Anita Borg founded the Institute for Women and Technology in 1994, which became AnitaB.org — the organization behind the Grace Hopper Celebration conference.',
  'Parisa Tabriz is Google\'s "Security Princess" — she\'s led Chrome\'s security team since 2007 and oversees security across one of the most used software products on Earth.',
  'Fran Allen\'s 1966 paper "Program Optimization" at IBM defined decades of compiler research and introduced the idea of program flow analysis.',
  'Megan Smith served as the United States Chief Technology Officer from 2014–2017, the first woman to hold that role.',
  'Reshma Saujani founded Girls Who Code in 2012 — the organization has since reached 500,000+ girls and young women in computing programs.',
  'Arlene Harris has been called the "Mother of Wireless" — she co-founded multiple wireless technology companies and holds dozens of telecom patents.',
  'Barbara Liskov developed the Liskov Substitution Principle (the L in SOLID) and won the Turing Award in 2008 — one of only three women ever to receive it.',
  'Shafi Goldwasser won the Turing Award in 2012 for her work on complexity theory, cryptography, and the foundations of probabilistic encryption.',
  'Joy Buolamwini\'s Algorithmic Justice League highlighted facial recognition bias — her research showed error rates up to 35% higher for darker-skinned women vs. lighter-skinned men.',
  'Carol Shaw was one of the first female game designers, creating River Raid for Atari in 1982 — still considered a design landmark of the era.',
  'Evelyn Berezin designed the first true word processor in 1971, the Vydec Word Processing System — predating any similar product by years.',
  'Annie Easley, a NASA computer scientist, developed code for the Centaur rocket stage — the technology later used in Cassini, Viking, and other landmark missions.',
  'Safra Catz has served as CEO of Oracle since 2014, overseeing one of the largest enterprise software companies in the world.',
  'Limor Fried (LadyAda) founded Adafruit Industries in 2005, building one of the most influential open-source hardware companies from her MIT dorm room.',
  'Yoky Matsuoka co-founded Google X and was Nest\'s first CTO — her research in neurobotics focused on brain-computer interfaces and prosthetic limb control.',
  'Timnit Gebru\'s research on data sheets for datasets and bias in AI systems has fundamentally changed how industry thinks about responsible AI development.',
  'The U.S. Navy\'s programming language ADA is named after Ada Lovelace — the only programming language named after a woman.',
  'In the 1960s, NASA employed hundreds of women as "computers" — the word meant a person who computed, before it meant a machine.',
  'Margaret Hamilton coined the term "software engineering" and led the Apollo 11 flight software team, whose code famously saved the moon landing.',
]

function simpleHash(str: string): number {
  let h = 2166136261
  for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); h >>>= 0 }
  return h >>> 0
}

function getTodaySignal(now: Date): string {
  return TODAY_POOL[simpleHash(now.toDateString()) % TODAY_POOL.length]
}

// ── render ────────────────────────────────────────────────────────────────────

export async function specialReport(): Promise<void> {
  const t = await loadTheme(); ACCENT = t.ACCENT; DIM = t.DIM
  const now      = new Date()
  const phase    = getMoonPhase(now)
  const symbol   = getMoonPhaseSymbol(phase)
  const phaseName = getMoonPhaseName(phase)
  const dateStr  = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  }).toLowerCase()

  const reposDir    = await getReposDir()
  const repos       = reposDir ? findGitRepos(reposDir) : []
  const git         = getGitStats(repos)
  const openTasks   = reposDir ? getOpenTasks(reposDir) : []
  const todaySignal = getTodaySignal(now)
  const todayDow    = (now.getDay() + 6) % 7

  console.log()
  console.log(hr())
  console.log()
  console.log(`  ${ACCENT}◆${RESET} ${BOLD}clarissa special report${RESET}`)
  console.log(`  ${DIM}${symbol} ${phaseName}  ·  ${dateStr}${RESET}`)
  console.log()
  console.log(hr())
  console.log()

  // this week
  if (reposDir) {
    console.log(`  ${DIM}this week${RESET}`)
    console.log()
    if (git.commits > 0) {
      const statParts = [`${BOLD}${git.commits}${RESET} commits`]
      if (git.streak > 0) statParts.push(`${git.streak}-day streak`)
      console.log(`  ${statParts.join(`  ${DIM}·${RESET}  `)}`)
      const supportParts: string[] = [git.fileLabel]
      if (git.activeProjects.length > 0) supportParts.push(git.activeProjects.join(', '))
      if (git.timingSentence) supportParts.push(git.timingSentence)
      console.log(`  ${DIM}${supportParts.join('  ·  ')}${RESET}`)
      console.log()
    }
    renderBars(git.commitsByDay, todayDow)
    console.log()
  } else {
    console.log(`  ${ACCENT}·${RESET}  run clarissa setup and enter your projects folder`)
    console.log(`  ${DIM}   any git repos inside it will track commits, streak, and open tasks${RESET}`)
    console.log()
  }

  // open tasks
  if (openTasks.length > 0) {
    console.log(`  ${DIM}open tasks${RESET}`)
    console.log()
    const pad = Math.max(...openTasks.map(p => p.project.length))
    for (const { project, tasks } of openTasks) {
      console.log(`  ${ACCENT}${project.padEnd(pad)}${RESET}  ${DIM}${tasks[0]}${RESET}`)
      for (const t of tasks.slice(1)) {
        console.log(`  ${''.padEnd(pad)}  ${DIM}${t}${RESET}`)
      }
    }
    console.log()
  }

  // tip
  console.log(`  ${DIM}┌─────┐${RESET}`)
  console.log(`  ${DIM}│${RESET} tip ${DIM}│${RESET}  ${todaySignal}`)
  console.log(`  ${DIM}└─────┘${RESET}`)
  console.log()
  console.log(hr())
  console.log()

  // nav pause
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  console.log(`  ${DIM}m  menu   q  quit${RESET}`)
  console.log()
  while (true) {
    const pick = (await rl.question(`  ${DIM}→${RESET}  `)).trim().toLowerCase()
    if (pick === 'q' || pick === 'quit') { rl.close(); process.exit(0) }
    if (!pick || pick === 'm' || pick === 'menu') {
      rl.close()
      const { welcome } = await import('./welcome.js')
      await welcome()
      return
    }
    console.log(`  ${DIM}press m for menu or q to quit${RESET}`)
  }
}
