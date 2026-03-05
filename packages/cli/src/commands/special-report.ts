import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { getMoonPhase, getMoonPhaseName, getMoonPhaseSymbol } from '../astro/moon.js'

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

  return {
    commits: allDates.length,
    streak,
    fileLabel,
    activeProjects: [...new Set(activeProjects)],
    timingSentence,
  }
}

// ── archetype ─────────────────────────────────────────────────────────────────

function getArchetype() {
  const histPath = path.join(os.homedir(), '.zsh_history')
  let raw = ''
  try { raw = fs.readFileSync(histPath, 'utf-8') } catch { /* no history */ }

  const gitVerbs: Record<string, number> = {}
  let gitCount = 0, npmCount = 0, fileCount = 0, nodeCount = 0, buildCount = 0, total = 0

  for (const line of raw.split('\n')) {
    const cmd = line.trim()
      .replace(/^: \d+:\d+;/, '')  // extended history timestamps
      .replace(/^\$ /, '')          // prompt prefixes
      .trim()
    if (!cmd || cmd.startsWith('#')) continue
    total++

    if (cmd.startsWith('git ') || cmd === 'git') {
      gitCount++
      const verb = cmd.split(/\s+/)[1] ?? 'other'
      gitVerbs[verb] = (gitVerbs[verb] ?? 0) + 1
    } else if (/^(npm|yarn|pnpm|bun|pip|cargo|brew)\b/.test(cmd)) npmCount++
    else if (/^(mkdir|touch|cp|mv|rm|ls|find)\b/.test(cmd)) fileCount++
    else if (/^(node|npx|ts-node|tsx|deno)\b/.test(cmd)) nodeCount++
    else if (/^(build|deploy|vercel|netlify)\b/.test(cmd)) buildCount++
  }

  const t = Math.max(total, 1)
  let name = 'fresh start', glyph = '✦'
  if      (total < 50)                  { name = 'fresh start';     glyph = '✦' }
  else if (gitCount / t > 0.3)          { name = 'git witch';       glyph = '⬡' }
  else if (npmCount / t > 0.25)         { name = 'package goblin';  glyph = '⬡' }
  else if (fileCount / t > 0.25)        { name = 'file architect';  glyph = '⬜' }
  else if (buildCount / t > 0.15)       { name = 'builder';         glyph = '◈' }
  else if (nodeCount / t > 0.2)         { name = 'runner';          glyph = '▷' }
  else                                  { name = 'git witch';       glyph = '⬡' }

  // Verb-derived sentence (only meaningful if git witch)
  const status = gitVerbs['status'] ?? 0
  const commit = gitVerbs['commit'] ?? 0
  const push   = gitVerbs['push']   ?? 0
  const stash  = gitVerbs['stash']  ?? 0
  const rebase = (gitVerbs['rebase'] ?? 0) + (gitVerbs['cherry-pick'] ?? 0)
  const pull   = (gitVerbs['merge']  ?? 0) + (gitVerbs['pull'] ?? 0)

  let verbSentence = ''
  if (name === 'git witch') {
    if (status > commit && status > push)      verbSentence = 'you check before you move.'
    else if (commit + push > status)           verbSentence = 'regular cadence. you ship.'
    else if (stash > 5)                        verbSentence = 'always mid-something.'
    else if (rebase > pull && rebase > push)   verbSentence = 'you keep history clean.'
    else if (pull > push)                      verbSentence = 'collaborative flow.'
    else                                       verbSentence = 'git is your home base.'
  }

  return { name, glyph, verbSentence }
}

// ── claude stats ──────────────────────────────────────────────────────────────

function getClaudeStats() {
  const cachePath = path.join(os.homedir(), '.claude', 'stats-cache.json')
  try {
    const raw = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
    const weekAgo     = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    const activity: { date: string; sessionCount: number; messageCount: number }[] = raw.dailyActivity ?? []

    const thisWeekSessions = activity
      .filter(d => new Date(d.date) >= weekAgo)
      .reduce((s, d) => s + d.sessionCount, 0)
    const prevWeekSessions = activity
      .filter(d => new Date(d.date) >= twoWeeksAgo && new Date(d.date) < weekAgo)
      .reduce((s, d) => s + d.sessionCount, 0)

    const hourCounts: Record<string, number> = raw.hourCounts ?? {}
    const peakHour = (() => {
      const top = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]
      if (!top) return ''
      const h = parseInt(top[0])
      return `${h > 12 ? h - 12 : h === 0 ? 12 : h}${h >= 12 ? 'pm' : 'am'}`
    })()

    return {
      totalSessions: raw.totalSessions ?? 0,
      totalMessages: raw.totalMessages ?? 0,
      thisWeekSessions,
      prevWeekSessions,
      peakHour,
      asOf: raw.lastComputedDate ?? '',
    }
  } catch {
    return null
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
  'git log --oneline --graph. if you\'ve never run it, today\'s the day.',
  'what\'s the one thing on your list you\'ve been skipping?',
  'git stash list. anything in there you forgot about?',
  'your terminal is only as useful as your shortcuts. add one this week.',
  'the best commit message is a present-tense verb.',
  'when did you last run the thing you\'re building?',
  'a good alias saves 6 seconds. twenty times a day. do the math.',
  'what would you ship if you knew it would work?',
  'git diff HEAD~1. just to see what yesterday looked like.',
  'the best debugging tool is reading it out loud.',
  'you\'ve been at this for a while. what\'s gotten easier?',
  'push something today, even if it\'s small.',
  'what\'s the simplest version of what you\'re trying to do?',
  'your future self will thank you for writing that comment.',
  'close a tab you haven\'t looked at in three days.',
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
  const HOME    = os.homedir()
  const CURSORZ = path.join(HOME, 'cursorz')

  const now      = new Date()
  const phase    = getMoonPhase(now)
  const symbol   = getMoonPhaseSymbol(phase)
  const phaseName = getMoonPhaseName(phase)
  const dateStr  = now.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  }).toLowerCase()

  const repos       = findGitRepos(CURSORZ)
  const git         = getGitStats(repos)
  const arch        = getArchetype()
  const claude      = getClaudeStats()
  const openTasks   = getOpenTasks(CURSORZ)
  const todaySignal = getTodaySignal(now)

  console.log()
  console.log(hr())
  console.log()
  console.log(`  ${BOLD}clarissa special report${RESET}`)
  console.log(`  ${DIM}${symbol} ${phaseName}  ·  ${dateStr}${RESET}`)
  console.log()
  console.log(hr())
  console.log()

  // ── this week
  console.log(`  ${DIM}── this week${RESET}`)
  console.log()
  if (git.commits > 0) {
    const parts = [`${BOLD}${git.commits}${RESET} commits`]
    if (git.streak > 0) parts.push(`${git.streak}-day streak`)
    if (git.activeProjects.length > 0) parts.push(`${DIM}${git.activeProjects.join(', ')}${RESET}`)
    console.log(`  ${parts.join(`  ${DIM}·${RESET}  `)}`)
    console.log(`  ${DIM}${git.fileLabel}${RESET}`)
    if (git.timingSentence) console.log(`  ${DIM}${git.timingSentence}${RESET}`)
  } else {
    console.log(`  ${DIM}no commits this week${RESET}`)
  }
  console.log()

  // ── archetype
  console.log(`  ${DIM}── you are a ${arch.name}${RESET}`)
  console.log()
  if (arch.verbSentence) console.log(`  ${arch.verbSentence}`)
  console.log()

  // ── claude
  console.log(`  ${DIM}── claude${RESET}`)
  console.log()
  if (claude) {
    const trend = claude.thisWeekSessions > claude.prevWeekSessions ? ' ↑'
      : claude.thisWeekSessions < claude.prevWeekSessions ? ' ↓' : ''
    console.log(`  ${BOLD}${claude.totalSessions}${RESET} sessions  ·  ${BOLD}${claude.totalMessages}${RESET} messages all time`)
    if (claude.thisWeekSessions > 0 || claude.prevWeekSessions > 0) {
      const prevNote = claude.prevWeekSessions > 0 ? `  ${DIM}(${trend || '→'} from ${claude.prevWeekSessions} last week)${RESET}` : ''
      console.log(`  ${DIM}${claude.thisWeekSessions} sessions this week${prevNote}${RESET}`)
    }
    if (claude.peakHour) console.log(`  ${DIM}you tend to start around ${claude.peakHour}${RESET}`)
    if (claude.asOf) console.log(`  ${DIM}stats through ${claude.asOf}${RESET}`)
  } else {
    console.log(`  ${DIM}no claude stats found (~/.claude/stats-cache.json)${RESET}`)
  }
  console.log()

  // ── open tasks
  if (openTasks.length > 0) {
    console.log(`  ${DIM}── open tasks${RESET}`)
    console.log()
    const pad = Math.max(...openTasks.map(p => p.project.length))
    for (const { project, tasks } of openTasks) {
      console.log(`  ${ACCENT}${project.padEnd(pad)}${RESET}  ${DIM}${tasks.join('  ·  ')}${RESET}`)
    }
    console.log()
  }

  // ── today
  console.log(`  ${DIM}── today${RESET}`)
  console.log()
  console.log(`  ${todaySignal}`)
  console.log()
  console.log(hr())
  console.log()
}
