import test from 'node:test'
import assert from 'node:assert/strict'

const ANSI_PATTERN = /\u001b\[[0-?]*[ -/]*[@-~]/g
const FORBIDDEN_BLOCKS = /[▀▄█▌▐▖▗▘▙▚▛▜▝▞▟▓▒░■]/u

async function api() {
  return import('../dist/index.js')
}

test('room exposes four recognizable focus targets', async () => {
  const { ROOM_HOTSPOTS } = await api()
  assert.deepEqual(
    ROOM_HOTSPOTS.map(({ id, label }) => ({ id, label })),
    [
      { id: 'window', label: 'Window + outside ladder' },
      { id: 'desk', label: 'Desk + CRT computer' },
      { id: 'bed', label: 'Bed + closet' },
      { id: 'elvis', label: "Elvis's tank" },
    ],
  )
})

test('room frames are distinct, bounded, and free of seam-producing block glyphs', async () => {
  const { ROOM_HOTSPOTS, renderRoomFrame } = await api()
  const frames = ROOM_HOTSPOTS.map((_, focusIndex) => (
    renderRoomFrame({ focusIndex, useColor: false })
  ))
  assert.equal(new Set(frames).size, 4)

  for (const frame of frames) {
    const lines = frame.split('\n')
    assert.equal(lines.length, 29)
    assert.ok(lines.every(line => line.length === 104))
    assert.equal(frame.includes('\u001b'), false)
    assert.doesNotMatch(frame, FORBIDDEN_BLOCKS)
  }

  const colored = renderRoomFrame({ focusIndex: 3, useColor: true })
  const stripped = colored.replace(ANSI_PATTERN, '')
  assert.equal(stripped.includes('\u001b'), false)
  assert.ok(stripped.split('\n').every(line => line.length === 104))
  assert.doesNotMatch(stripped, FORBIDDEN_BLOCKS)
})
