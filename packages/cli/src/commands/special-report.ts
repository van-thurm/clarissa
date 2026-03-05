import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import * as readline from 'readline/promises'
import { getMoonPhase, getMoonPhaseName, getMoonPhaseSymbol } from '../astro/moon.js'
import { getReposDir } from '../state.js'

const RESET  = '\x1b[0m'
const DIM    = '\x1b[2m'
const BOLD   = '\x1b[1m'
const ACCENT = '\x1b[38;5;216m'

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
  // — terminal keyboard shortcuts —
  'ctrl+a  move to start of line',
  'ctrl+e  move to end of line',
  'ctrl+u  delete from cursor to start of line',
  'ctrl+k  delete from cursor to end of line',
  'ctrl+w  delete the word before cursor',
  'ctrl+r  reverse search through command history',
  'ctrl+l  clear the screen (keeps history)',
  'ctrl+c  cancel current command',
  'ctrl+z  suspend current process (fg to resume)',
  'ctrl+d  exit shell or send EOF',
  'alt+b   move back one word',
  'alt+f   move forward one word',
  'alt+d   delete word after cursor',
  'alt+.   paste last argument from previous command',
  'ctrl+p  previous command (same as up arrow)',
  'ctrl+n  next command (same as down arrow)',
  '!!      repeat last command',
  '!$      last argument of previous command',
  '!^      first argument of previous command',
  'ctrl+xx toggle between current position and start of line',
  'ctrl+t  swap character under cursor with the previous one',
  'ctrl+y  paste (yank) text previously deleted with ctrl+u or ctrl+k',
  'escape+t swap the two words before cursor',
  'tab     autocomplete file/command names — double-tap for options',
  'ctrl+_  undo last edit (works in most terminal emulators)',
  'cd -    go back to previous directory',
  'pushd / popd  push/pop directory stack — useful for multi-dir navigation',
  'history | grep <term>  search command history by keyword',
  'reset   fix a broken terminal display (when output is garbled)',
  '> file  redirect stdout to a file (overwrites)',
  '>> file append stdout to a file',
  '2>&1    redirect stderr to stdout',
  '| tee file  pipe output to screen AND save to file simultaneously',
  'cmd &   run command in background',
  'jobs    list background/suspended processes',
  'fg %1   bring background job 1 to foreground',
  'kill %1 terminate background job 1',
  'open .  open current directory in Finder (macOS)',
  'pbcopy  pipe to clipboard on macOS: cat file.txt | pbcopy',
  'pbpaste paste clipboard contents in terminal on macOS',
  'say "done"  macOS text-to-speech — useful for long builds',
  'caffeinate  prevent Mac from sleeping during long processes',
  'which <cmd>  show the full path to a command',
  'type <cmd>  show if a command is built-in, alias, or binary',
  'man <cmd>  open the manual page for any command',
  'tldr <cmd>  simplified man page examples (install with brew)',
  'option+click  move cursor to clicked position in most terminals',
  'cmd+k   clear terminal scrollback (macOS terminal.app)',
  'ctrl+shift+c / v  copy/paste in many Linux terminals',
  'esc then b/f  word-by-word navigation (when alt+b/f don\'t work)',

  // — git best practices —
  'commit often. a commit is a checkpoint, not a finished product.',
  'write commit messages in imperative mood: "fix bug" not "fixed bug"',
  'git status before anything. know what state you\'re in.',
  'git diff --staged  review exactly what you\'re about to commit',
  'use branches for every feature, bug, or experiment — even small ones',
  'git stash is your friend. clear state without losing work.',
  'git log --oneline --graph --all  see your whole branch tree at once',
  'rebase vs merge: rebase for clean history, merge for shared branches',
  'never force-push to a shared branch. it rewrites history for everyone.',
  'squash commits before merging a PR — keep the main branch clean',
  '.gitignore is a first-class part of your project. write it early.',
  'use git bisect to find the exact commit that introduced a bug',
  'tag your releases: git tag v1.0.0 — makes rollback trivial',
  'git blame <file>  see who last changed every line and why',
  'keep commits small and focused on one logical change',
  'pull before you push — avoid unnecessary merge conflicts',
  'use git worktrees to work on two branches simultaneously',
  'alias your most-used git commands in .gitconfig or .zshrc',
  'cherry-pick moves individual commits between branches without merging',
  'git reflog is a safety net — recent actions are recoverable for weeks',
  'git clean -fd  remove untracked files and directories (destructive!)',
  'git shortlog -sn  see contributors ranked by commit count',
  'write a CONTRIBUTING.md — define commit conventions for the team',
  'use .git/hooks/pre-commit to automate linting before every commit',
  'git show HEAD  review the last commit in full detail',
  'interactive rebase: git rebase -i HEAD~5 to edit recent history',
  'git archive  export a clean snapshot without the .git folder',
  'sign commits with GPG for verified author identity on GitHub',
  'semantic versioning: MAJOR.MINOR.PATCH — know which one to bump',
  'use conventional commits: feat:, fix:, chore:, docs:, refactor:',
  'git config --global alias.lg "log --oneline --graph --all"  save it',
  'before deleting a branch, make sure it\'s merged: git branch --merged',
  'git fetch vs git pull: fetch downloads, pull fetches AND merges',
  'git diff origin/main  compare local branch to remote before a PR',
  'mark incomplete work with a WIP: commit — signals it\'s not ready',
  'never commit secrets. use environment variables and .env files.',

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
