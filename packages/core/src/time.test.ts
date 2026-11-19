import { describe, expect, it } from 'vitest'
import { findConflict, formatMin, minToPx, overlaps, pxToMin, snapMin } from './time'
import type { Block } from './types'

// 직접 구현할 때 아래 describe.skip을 describe로 바꾸고 통과시킨다.

function block(id: string, startMin: number, endMin: number, deletedAt: number | null = null): Block {
  return {
    id,
    date: '2026-11-18',
    startMin,
    endMin,
    title: id,
    categoryId: null,
    status: 'planned',
    memo: null,
    createdAt: 0,
    updatedAt: 0,
    deletedAt,
  }
}

describe.skip('time', () => {
  describe('formatMin', () => {
    it.each([
      [0, '00:00'],
      [5, '00:05'],
      [360, '06:00'],
      [615, '10:15'],
      [1439, '23:59'],
      [1440, '24:00'],
    ])('formats %i as %s', (min, expected) => {
      expect(formatMin(min)).toBe(expected)
    })
  })

  describe('snapMin', () => {
    it.each([
      [600, 15, 600],
      [607, 15, 600],
      [614, 15, 600],
      [615, 15, 615],
      [29, 30, 0],
      [0, 15, 0],
    ])('snaps %i to unit %i as %i (floor)', (min, unit, expected) => {
      expect(snapMin(min, unit)).toBe(expected)
    })
  })

  describe('minToPx / pxToMin', () => {
    it('converts minutes to pixels linearly', () => {
      expect(minToPx(0, 2.4)).toBe(0)
      expect(minToPx(15, 2.4)).toBeCloseTo(36)
      expect(minToPx(60, 2.4)).toBeCloseTo(144)
    })

    it('converts pixels to whole minutes, rounding down', () => {
      expect(pxToMin(0, 2.4)).toBe(0)
      expect(pxToMin(36, 2.4)).toBe(15)
      expect(pxToMin(35.9, 2.4)).toBe(14)
      expect(pxToMin(144, 2.4)).toBe(60)
    })

    it('round-trips whole minutes', () => {
      for (const min of [0, 15, 90, 1080]) {
        expect(pxToMin(minToPx(min, 2.4), 2.4)).toBe(min)
      }
    })
  })

  describe('overlaps', () => {
    it('detects overlapping ranges', () => {
      expect(overlaps({ startMin: 600, endMin: 660 }, { startMin: 630, endMin: 690 })).toBe(true)
      expect(overlaps({ startMin: 600, endMin: 690 }, { startMin: 615, endMin: 630 })).toBe(true)
      expect(overlaps({ startMin: 615, endMin: 630 }, { startMin: 600, endMin: 690 })).toBe(true)
      expect(overlaps({ startMin: 600, endMin: 615 }, { startMin: 600, endMin: 615 })).toBe(true)
    })

    it('treats touching ranges as not overlapping', () => {
      expect(overlaps({ startMin: 600, endMin: 615 }, { startMin: 615, endMin: 630 })).toBe(false)
      expect(overlaps({ startMin: 615, endMin: 630 }, { startMin: 600, endMin: 615 })).toBe(false)
    })

    it('treats separate ranges as not overlapping', () => {
      expect(overlaps({ startMin: 600, endMin: 615 }, { startMin: 700, endMin: 715 })).toBe(false)
    })
  })

  describe('findConflict', () => {
    const blocks = [block('c', 720, 750), block('a', 600, 630), block('b', 630, 660)]

    it('returns null when nothing overlaps', () => {
      expect(findConflict(blocks, { startMin: 660, endMin: 720 })).toBeNull()
    })

    it('returns the earliest overlapping block regardless of input order', () => {
      expect(findConflict(blocks, { startMin: 615, endMin: 735 })?.id).toBe('a')
    })

    it('ignores the block being edited', () => {
      expect(findConflict(blocks, { startMin: 600, endMin: 630 }, 'a')).toBeNull()
      expect(findConflict(blocks, { startMin: 600, endMin: 645 }, 'a')?.id).toBe('b')
    })

    it('ignores deleted blocks', () => {
      const withDeleted = [block('gone', 600, 630, 123)]
      expect(findConflict(withDeleted, { startMin: 600, endMin: 615 })).toBeNull()
    })

    it('returns null for an empty list', () => {
      expect(findConflict([], { startMin: 600, endMin: 615 })).toBeNull()
    })
  })
})
