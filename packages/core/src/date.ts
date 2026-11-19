import { addDays as addDaysToDate, format, isValid, parse } from 'date-fns'
import { ko } from 'date-fns/locale'

const DATE_FORMAT = 'yyyy-MM-dd'
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parseDate(date: string): Date {
  return parse(date, DATE_FORMAT, new Date(2000, 0, 1))
}

export function isDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const parsed = parseDate(value)
  return isValid(parsed) && format(parsed, DATE_FORMAT) === value
}

export function addDays(date: string, amount: number): string {
  return format(addDaysToDate(parseDate(date), amount), DATE_FORMAT)
}

export function todayString(now: Date): string {
  return format(now, DATE_FORMAT)
}

export function formatDateLabel(date: string): string {
  return format(parseDate(date), 'M월 d일 (EEEEE)', { locale: ko })
}
