import { canSetDuration, canShift, draftFromNew, ruleErrorMessage, setDuration, shiftStart } from '../draft'

describe('draft', () => {
  it('creates a 15-minute planned draft', () => {
    expect(draftFromNew(600)).toEqual({ startMin: 600, endMin: 615, title: '', categoryId: null, status: 'planned' })
  })

  it('shifts start and end together by 15 minutes', () => {
    expect(shiftStart(draftFromNew(600), 15)).toMatchObject({ startMin: 615, endMin: 630 })
    expect(shiftStart(draftFromNew(600), -15)).toMatchObject({ startMin: 585, endMin: 600 })
  })

  it('blocks shifting past the day range', () => {
    expect(canShift(draftFromNew(360), -15)).toBe(false)
    expect(canShift(draftFromNew(1425), 15)).toBe(false)
    expect(canShift(draftFromNew(600), 15)).toBe(true)
  })

  it('sets duration from the start and blocks durations past 24:00', () => {
    expect(setDuration(draftFromNew(600), 60)).toMatchObject({ startMin: 600, endMin: 660 })
    expect(canSetDuration(draftFromNew(1395), 45)).toBe(true)
    expect(canSetDuration(draftFromNew(1395), 60)).toBe(false)
  })

  it('formats rule errors in Korean', () => {
    const conflict = {
      id: 'gym', date: '2026-11-18', startMin: 600, endMin: 630, title: '헬스장', categoryId: null,
      status: 'planned' as const, memo: null, createdAt: 0, updatedAt: 0, deletedAt: null,
    }
    expect(ruleErrorMessage({ code: 'OVERLAP', conflict })).toBe("10:00–10:30 '헬스장'과 겹쳐요")
    expect(ruleErrorMessage({ code: 'OVERLAP', conflict: { ...conflict, title: '' } })).toBe("10:00–10:30 '제목 없음'과 겹쳐요")
    expect(ruleErrorMessage({ code: 'OUT_OF_DAY_RANGE' })).toBe('06:00~24:00 안에서만 만들 수 있어요')
    expect(ruleErrorMessage({ code: 'END_NOT_AFTER_START' })).toBe('끝 시각이 시작 시각보다 늦어야 해요')
    expect(ruleErrorMessage({ code: 'NOT_ALIGNED_TO_UNIT' })).toBe('15분 단위로만 정할 수 있어요')
  })
})
