import type { Block, TimeRange } from './types'

/** 자정부터의 분을 "HH:MM"으로. 1440은 "24:00". */
export function formatMin(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** 분을 unit 단위로 내림. snapMin(607, 15) === 600 */
export function snapMin(min: number, unit: number): number {
  return Math.floor(min / unit) * unit
}

/** 분 길이를 화면 픽셀로. */
export function minToPx(min: number, pxPerMin: number): number {
  return min * pxPerMin
}

/** 화면 픽셀을 분으로(소수점 내림). */
export function pxToMin(px: number, pxPerMin: number): number {
  // 부동소수점 오차(36 / 2.4 = 14.999...)로 경계값이 한 칸 아래로 내려가지 않게 보정
  return Math.floor(px / pxPerMin + 1e-9)
}

/** 반열린 구간 [start, end)끼리 겹치는지. 맞닿음은 겹침 아님. */
export function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.startMin < b.endMin && b.startMin < a.endMin
}

/** candidate와 겹치는 블록 중 시작 시각이 가장 이른 것. ignoreId와 같은 블록, 삭제된 블록은 제외. 없으면 null. */
export function findConflict(blocks: readonly Block[], candidate: TimeRange, ignoreId?: string): Block | null {
  let found: Block | null = null
  for (const b of blocks) {
    if (b.id === ignoreId || b.deletedAt !== null || !overlaps(b, candidate)) continue
    if (found === null || b.startMin < found.startMin) found = b
  }
  return found
}
