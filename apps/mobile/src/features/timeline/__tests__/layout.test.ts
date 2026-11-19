import { PX_PER_MIN, tapToStartMin, timelineHeight } from '../layout'

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
