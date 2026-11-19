import { describe, expect, it } from 'vitest'
import { addDays, formatDateLabel, isDateString, todayString } from './date'

describe('isDateString', () => {
  it.each(['2026-11-18', '2024-02-29', '2026-01-01'])('accepts %s', (value) => {
    expect(isDateString(value)).toBe(true)
  })

  it.each(['2026-11-31', '2026-02-29', '2026-1-18', '20261118', '', '2026-13-01'])('rejects %p', (value) => {
    expect(isDateString(value)).toBe(false)
  })
})

describe('addDays', () => {
  it('moves forward and backward by days', () => {
    expect(addDays('2026-11-18', 1)).toBe('2026-11-19')
    expect(addDays('2026-11-18', -1)).toBe('2026-11-17')
  })

  it('crosses month, year and leap-day boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('todayString', () => {
  it('formats the local date of the given moment', () => {
    expect(todayString(new Date(2026, 10, 18, 23, 59))).toBe('2026-11-18')
    expect(todayString(new Date(2026, 10, 19, 0, 0))).toBe('2026-11-19')
  })
})

describe('formatDateLabel', () => {
  it('formats month, day and Korean weekday', () => {
    expect(formatDateLabel('2026-11-18')).toBe('11월 18일 (수)')
    expect(formatDateLabel('2027-01-03')).toBe('1월 3일 (일)')
  })
})
