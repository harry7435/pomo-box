import type { Block } from '@pomobox/core'
import { PX_PER_MIN, entryScrollY, tapToStartMin, timelineHeight } from '../layout'

describe('timeline layout', () => {
  it('uses 2.4px per minute', () => {
    expect(PX_PER_MIN).toBe(2.4)
    expect(timelineHeight()).toBeCloseTo((1440 - 360) * 2.4)
  })

  it('maps a tap to the start of its 15-minute slot', () => {
    expect(tapToStartMin(0)).toBe(360)
    expect(tapToStartMin(35)).toBe(360)
    expect(tapToStartMin(36)).toBe(375)
    expect(tapToStartMin(4 * 144 + 10)).toBe(600)
  })

  it('clamps taps at the bottom so a 15-minute block still fits', () => {
    expect(tapToStartMin(timelineHeight())).toBe(1425)
    expect(tapToStartMin(timelineHeight() + 100)).toBe(1425)
    expect(tapToStartMin(-10)).toBe(360)
  })
})

describe('entryScrollY', () => {
  const at = (startMin: number) => ({ startMin }) as Block
  const now = new Date(2026, 10, 18, 12, 0) // 12:00 -> 720분

  it('puts now at the top third on today', () => {
    expect(entryScrollY({ isToday: true, now, blocks: [at(400)], windowHeight: 900 })).toBeCloseTo((720 - 360) * 2.4 - 300)
  })

  it('goes to the first block on another day, or 06:00 when empty', () => {
    expect(entryScrollY({ isToday: false, now, blocks: [at(600)], windowHeight: 900 })).toBeCloseTo((600 - 360) * 2.4 - 16)
    expect(entryScrollY({ isToday: false, now, blocks: [], windowHeight: 900 })).toBe(0)
  })
})
