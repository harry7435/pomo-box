import { describe, expect, it } from 'vitest'
import { nextQuickStatus } from './blockStatus'

describe('nextQuickStatus', () => {
  it.each([
    ['planned', 'done'],
    ['done', 'planned'],
    ['partial', 'done'],
    ['skipped', 'done'],
  ] as const)('%s → %s', (from, to) => {
    expect(nextQuickStatus(from)).toBe(to)
  })
})
