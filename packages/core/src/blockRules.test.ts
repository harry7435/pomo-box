import { describe, expect, it } from 'vitest'
import { validateBlockInput } from './blockRules'
import type { Block } from './types'

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

const codes = (errors: ReturnType<typeof validateBlockInput>) => errors.map((e) => e.code)

describe('validateBlockInput', () => {
  it('accepts a valid aligned block inside the day', () => {
    expect(validateBlockInput({ startMin: 600, endMin: 615 }, [])).toEqual([])
    expect(validateBlockInput({ startMin: 360, endMin: 1440 }, [])).toEqual([])
  })

  it('rejects an end that is not after the start', () => {
    expect(codes(validateBlockInput({ startMin: 600, endMin: 600 }, []))).toContain('END_NOT_AFTER_START')
    expect(codes(validateBlockInput({ startMin: 615, endMin: 600 }, []))).toContain('END_NOT_AFTER_START')
  })

  it('rejects blocks outside 06:00–24:00', () => {
    expect(codes(validateBlockInput({ startMin: 345, endMin: 375 }, []))).toContain('OUT_OF_DAY_RANGE')
    expect(codes(validateBlockInput({ startMin: 1425, endMin: 1455 }, []))).toContain('OUT_OF_DAY_RANGE')
  })

  it('rejects times not aligned to the block unit', () => {
    expect(codes(validateBlockInput({ startMin: 605, endMin: 620 }, []))).toContain('NOT_ALIGNED_TO_UNIT')
    expect(codes(validateBlockInput({ startMin: 600, endMin: 610 }, []))).toContain('NOT_ALIGNED_TO_UNIT')
  })

  it('reports the overlapping block', () => {
    const errors = validateBlockInput({ startMin: 600, endMin: 645 }, [block('gym', 630, 660)])
    expect(errors).toEqual([{ code: 'OVERLAP', conflict: expect.objectContaining({ id: 'gym' }) }])
  })

  it('allows touching blocks, ignores the edited block and deleted blocks', () => {
    expect(validateBlockInput({ startMin: 600, endMin: 630 }, [block('next', 630, 660)])).toEqual([])
    expect(validateBlockInput({ startMin: 600, endMin: 645 }, [block('self', 600, 630)], 'self')).toEqual([])
    expect(validateBlockInput({ startMin: 600, endMin: 645 }, [block('gone', 600, 630, 1)])).toEqual([])
  })
})
