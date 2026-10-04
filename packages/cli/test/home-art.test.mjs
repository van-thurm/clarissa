import test from 'node:test'
import assert from 'node:assert/strict'

const ANSI_PATTERN = /\u001b\[[0-?]*[ -/]*[@-~]/g

async function api() {
  return import('../dist/index.js')
}

test('home menu maps six distinct approved expressions', async () => {
  const { HOME_MENU } = await api()
  assert.deepEqual(
    HOME_MENU.map(({ key, label, expression }) => ({ key, label, expression })),
    [
      { key: '1', label: 'today', expression: 'sunny' },
      { key: '2', label: 'horoscope', expression: 'dreamy' },
      { key: '3', label: 'crafts', expression: 'excited' },
      { key: '4', label: 'planetarium', expression: 'wink' },
      { key: '5', label: 'room', expression: 'cool' },
      { key: '6', label: 'setup', expression: 'focused' },
    ],
  )
  assert.equal(new Set(HOME_MENU.map(item => item.expression)).size, 6)
})

test('avatar home frame changes expression with selection', async () => {
  const { HOME_MENU, renderAvatarHomeFrame } = await api()
  const frames = HOME_MENU.map((_, selected) => (
    renderAvatarHomeFrame({ selected, useColor: false, columns: 80 })
  ))
  assert.equal(new Set(frames).size, 6)
  for (const [selected, frame] of frames.entries()) {
    assert.match(frame, new RegExp(`\\[${HOME_MENU[selected].key} ${HOME_MENU[selected].label.toUpperCase()}\\]`))
  }
})

test('avatar home keeps instructions minimal and renders safely with and without color', async () => {
  const { renderAvatarHomeFrame } = await api()
  const plain = renderAvatarHomeFrame({ selected: 0, useColor: false, columns: 80 })
  assert.match(plain, /ARROWS move\s+\|\s+Q quit/)
  assert.doesNotMatch(plain, /ENTER|1-6 choose/)
  assert.equal(plain.split('\n').length, 29)
  assert.ok(plain.split('\n').every(line => [...line].length <= 79))
  assert.equal(plain.includes('\u001b'), false)

  const colored = renderAvatarHomeFrame({ selected: 4, useColor: true, columns: 80 })
  const stripped = colored.replace(ANSI_PATTERN, '')
  assert.equal(stripped.includes('\u001b'), false)
  assert.ok(stripped.split('\n').every(line => [...line].length <= 79))
})
