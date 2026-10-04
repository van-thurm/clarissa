import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { access, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url))
const CLI_PATH = path.resolve(TEST_DIR, '../dist/cli.js')
const ANSI_PATTERN = /\u001b\[[0-?]*[ -/]*[@-~]/g

const CHART_FIXTURE = {
  palette: 'mono',
  chart: {
    userName: 'Test Reader',
    birthDate: '1990-01-01',
    birthTime: '12:00',
    birthPlace: 'Test City',
    sun: { sign: 'Aries', degree: 1 },
    moon: { sign: 'Taurus', degree: 2 },
    rising: { sign: 'Gemini', degree: 3 },
    mercury: { sign: 'Cancer', degree: 4 },
    venus: { sign: 'Leo', degree: 5 },
    mars: { sign: 'Virgo', degree: 6 },
    jupiter: { sign: 'Libra', degree: 7 },
    saturn: { sign: 'Scorpio', degree: 8 },
    uranus: { sign: 'Sagittarius', degree: 9 },
    neptune: { sign: 'Capricorn', degree: 10 },
    pluto: { sign: 'Aquarius', degree: 11 },
  },
}

const NO_CHART_FIXTURE = {
  palette: 'mono',
}

function stripAnsi(value) {
  return value.replace(ANSI_PATTERN, '')
}

function matches(value, expected) {
  if (typeof expected === 'string') return value.includes(expected)
  return new RegExp(expected.source, expected.flags.replaceAll('g', '')).test(value)
}

async function withIsolatedHome(fixture, callback) {
  const home = await mkdtemp(path.join(os.tmpdir(), 'clarissa-menu-flow-'))
  const stateDir = path.join(home, '.clarissa')
  await mkdir(stateDir, { recursive: true })
  await writeFile(path.join(stateDir, 'state.json'), JSON.stringify(fixture, null, 2))

  try {
    return await callback(home)
  } finally {
    await rm(home, { recursive: true, force: true })
    await assert.rejects(access(home), error => error?.code === 'ENOENT')
  }
}

function runCli(home, { args = [], steps = [] } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI_PATH, ...args], {
      env: { ...process.env, HOME: home },
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''
    let stepIndex = 0
    let searchOffset = 0
    let advancing = false
    let settled = false
    const stepOutputs = []

    const finish = (error, result) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      if (error) reject(error)
      else resolve(result)
    }

    const advance = async () => {
      if (advancing || stepIndex >= steps.length) return

      const output = stripAnsi(stdout)
      const step = steps[stepIndex]
      const stepOutput = output.slice(searchOffset)
      if (!matches(stepOutput, step.waitFor)) return

      advancing = true
      searchOffset = output.length
      stepIndex += 1
      stepOutputs.push(stepOutput)

      try {
        if (step.beforeInput) await step.beforeInput()
        child.stdin.write(step.input)
        if (stepIndex === steps.length) child.stdin.end()
      } catch (error) {
        child.kill('SIGKILL')
        finish(error)
      } finally {
        advancing = false
      }
    }

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => {
      stdout += chunk
      void advance()
    })
    child.stderr.on('data', chunk => {
      stderr += chunk
    })
    child.on('error', error => finish(error))
    child.on('close', (code, signal) => {
      const output = stripAnsi(stdout)
      if (stepIndex !== steps.length) {
        finish(new Error(
          `CLI exited before step ${stepIndex + 1}/${steps.length} (code ${code}, signal ${signal})\n${output}\n${stderr}`,
        ))
        return
      }
      finish(null, { status: code, output, stderr: stripAnsi(stderr), stepOutputs })
    })

    const timeout = setTimeout(() => {
      child.kill('SIGKILL')
      finish(new Error(
        `CLI timed out at step ${stepIndex + 1}/${steps.length}\n${stripAnsi(stdout)}\n${stripAnsi(stderr)}`,
      ))
    }, 10_000)

    if (steps.length === 0) child.stdin.end()
  })
}

function assertCleanExit(result) {
  assert.equal(result.status, 0)
  assert.equal(result.stderr, '')
}

test('Horoscope shows lettered actions without shell command hints', async () => {
  await withIsolatedHome(CHART_FIXTURE, async home => {
    const result = await runCli(home, {
      steps: [
        { waitFor: /2\s+horoscope/, input: '2\n' },
        {
          waitFor: /a\s+big three[\s\S]*b\s+natal chart[\s\S]*c\s+advice[\s\S]*q\s+back/,
          input: 'q\n',
        },
        { waitFor: /2\s+horoscope/, input: 'q\n' },
      ],
    })

    assertCleanExit(result)
    assert.doesNotMatch(result.output, /clarissa (?:me|chart|advice)/)
  })
})

test('Horoscope action a opens the big three and returns to its actions', async () => {
  await withIsolatedHome(CHART_FIXTURE, async home => {
    const result = await runCli(home, {
      steps: [
        { waitFor: /2\s+horoscope/, input: '2\n' },
        { waitFor: /a\s+big three/, input: 'a\n' },
        { waitFor: /THE BIG THREE[\s\S]*a\s+big three/, input: 'q\n' },
        { waitFor: /2\s+horoscope/, input: 'q\n' },
      ],
    })

    assertCleanExit(result)
    assert.match(result.output, /Sun in Aries/)
  })
})

test('Horoscope action b opens the natal chart and returns to its actions', async () => {
  await withIsolatedHome(CHART_FIXTURE, async home => {
    const result = await runCli(home, {
      steps: [
        { waitFor: /2\s+horoscope/, input: '2\n' },
        { waitFor: /b\s+natal chart/, input: 'b\n' },
        { waitFor: /natal chart[\s\S]*OUTER PLANETS[\s\S]*a\s+big three/, input: 'q\n' },
        { waitFor: /2\s+horoscope/, input: 'q\n' },
      ],
    })

    assertCleanExit(result)
    assert.match(result.output, /Pluto\s+Aquarius/)
  })
})

test('Horoscope action c asks for advice and returns to its actions', async () => {
  await withIsolatedHome(CHART_FIXTURE, async home => {
    const result = await runCli(home, {
      steps: [
        { waitFor: /2\s+horoscope/, input: '2\n' },
        { waitFor: /c\s+advice/, input: 'c\n' },
        { waitFor: /what's on your mind\?/, input: 'should i ship today?\n' },
        { waitFor: /"should i ship today\?"[\s\S]*a\s+big three/, input: 'q\n' },
        { waitFor: /2\s+horoscope/, input: 'q\n' },
      ],
    })

    assertCleanExit(result)
    assert.match(result.output, /→\s+\S/)
  })
})

test('Horoscope rechecks chart state after setup returns', async () => {
  await withIsolatedHome(NO_CHART_FIXTURE, async home => {
    const result = await runCli(home, {
      steps: [
        { waitFor: /2\s+horoscope/, input: '2\n' },
        { waitFor: /a\s+setup birth chart[\s\S]*q\s+back/, input: 'a\n' },
        {
          waitFor: /d\s+birth chart[\s\S]*q\s+back/,
          beforeInput: () => writeFile(
            path.join(home, '.clarissa', 'state.json'),
            JSON.stringify({ ...NO_CHART_FIXTURE, chart: CHART_FIXTURE.chart }, null, 2),
          ),
          input: 'q\n',
        },
        {
          waitFor: /a\s+big three[\s\S]*b\s+natal chart[\s\S]*c\s+advice[\s\S]*q\s+back/,
          input: 'q\n',
        },
        { waitFor: /2\s+horoscope/, input: 'q\n' },
      ],
    })

    assertCleanExit(result)
    assert.doesNotMatch(result.output, /run clarissa setup/)
    assert.match(result.stepOutputs[1], /a\s+setup birth chart/)
    assert.match(result.stepOutputs[3], /a\s+big three[\s\S]*b\s+natal chart[\s\S]*c\s+advice/)
    assert.doesNotMatch(result.stepOutputs[3], /a\s+setup birth chart/)
  })
})

test('Horoscope offers setup before advice when no chart exists', async () => {
  await withIsolatedHome(NO_CHART_FIXTURE, async home => {
    const result = await runCli(home, {
      steps: [
        { waitFor: /2\s+horoscope/, input: '2\n' },
        { waitFor: /a\s+setup birth chart[\s\S]*q\s+back/, input: 'a\n' },
        { waitFor: /d\s+birth chart/, input: 'q\n' },
        { waitFor: /a\s+setup birth chart/, input: 'q\n' },
        { waitFor: /2\s+horoscope/, input: 'q\n' },
      ],
    })

    assertCleanExit(result)
    assert.equal(result.output.includes("what's on your mind?"), false)
  })
})

test('invalid Horoscope input names visible keys and reprompts', async () => {
  await withIsolatedHome(CHART_FIXTURE, async home => {
    const result = await runCli(home, {
      steps: [
        { waitFor: /2\s+horoscope/, input: '2\n' },
        { waitFor: /a\s+big three/, input: 'z\n' },
        { waitFor: /press a · b · c · q[\s\S]*a\s+big three/, input: 'q\n' },
        { waitFor: /2\s+horoscope/, input: 'q\n' },
      ],
    })

    assertCleanExit(result)
    assert.ok((result.output.match(/a\s+big three/g) ?? []).length >= 2)
  })
})

test('back from Horoscope returns to the welcome menu', async () => {
  await withIsolatedHome(CHART_FIXTURE, async home => {
    const result = await runCli(home, {
      steps: [
        { waitFor: /2\s+horoscope/, input: '2\n' },
        { waitFor: /a\s+big three/, input: 'back\n' },
        { waitFor: /2\s+horoscope/, input: 'q\n' },
      ],
    })

    assertCleanExit(result)
    assert.ok((result.output.match(/1\s+today/g) ?? []).length >= 2)
  })
})

test('Today opens the daily view and returns to the expressive home', async () => {
  await withIsolatedHome(CHART_FIXTURE, async home => {
    const result = await runCli(home, {
      steps: [
        { waitFor: /1\s+today/, input: '1\n' },
        { waitFor: /Aries\s+·\s+☽\s+Taurus[\s\S]*q\s+back/, input: 'q\n' },
        { waitFor: /1\s+today/, input: 'q\n' },
      ],
    })

    assertCleanExit(result)
    assert.match(result.output, /Sun in Aries|☉ Aries/)
  })
})

test('Room menu opens the visual room and returns home', async () => {
  await withIsolatedHome(CHART_FIXTURE, async home => {
    const result = await runCli(home, {
      steps: [
        { waitFor: /5\s+room/, input: '5\n' },
        { waitFor: /CLARISSA'S ROOM[\s\S]*LEFT\/RIGHT or TAB focus[\s\S]*5\s+room/, input: 'q\n' },
      ],
    })

    assertCleanExit(result)
    assert.match(result.output, /WINDOW \+ OUTSIDE LADDER/)
  })
})

test('direct room renders a static fallback outside a TTY', async () => {
  await withIsolatedHome(CHART_FIXTURE, async home => {
    const result = await runCli(home, { args: ['room'] })
    assertCleanExit(result)
    assert.match(result.output, /CLARISSA'S ROOM/)
    assert.match(result.output, /LEFT\/RIGHT or TAB focus/)
  })
})

test('direct daily remains print-and-exit with shell command hints', async () => {
  await withIsolatedHome(CHART_FIXTURE, async home => {
    const result = await runCli(home, { args: ['daily'] })

    assertCleanExit(result)
    assert.match(result.output, /clarissa me\s+full big three interpretations/)
    assert.match(result.output, /clarissa chart\s+all 11 placements/)
    assert.match(result.output, /clarissa advice\s+ask a question about today/)
    assert.doesNotMatch(result.output, /a\s+big three/)
    assert.doesNotMatch(result.output, /→/)
  })
})
