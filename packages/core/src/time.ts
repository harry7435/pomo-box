import type { Block, TimeRange } from './types'

// 이 파일의 함수 본문은 직접 작성한다(docs/guides/working-agreement.md). 테스트: time.test.ts

/** 자정부터의 분을 "HH:MM"으로. 1440은 "24:00". */
export function formatMin(min: number): string {
  throw new Error(`formatMin(${min}) not implemented`)
}

/** 분을 unit 단위로 내림. snapMin(607, 15) === 600 */
export function snapMin(min: number, unit: number): number {
  throw new Error(`snapMin(${min}, ${unit}) not implemented`)
}

/** 분 길이를 화면 픽셀로. */
export function minToPx(min: number, pxPerMin: number): number {
  throw new Error(`minToPx(${min}, ${pxPerMin}) not implemented`)
}

/** 화면 픽셀을 분으로(소수점 내림). */
export function pxToMin(px: number, pxPerMin: number): number {
  throw new Error(`pxToMin(${px}, ${pxPerMin}) not implemented`)
}

/** 반열린 구간 [start, end)끼리 겹치는지. 맞닿음은 겹침 아님. */
export function overlaps(a: TimeRange, b: TimeRange): boolean {
  throw new Error(`overlaps(${JSON.stringify(a)}, ${JSON.stringify(b)}) not implemented`)
}

/** candidate와 겹치는 블록 중 시작 시각이 가장 이른 것. ignoreId와 같은 블록, 삭제된 블록은 제외. 없으면 null. */
export function findConflict(blocks: readonly Block[], candidate: TimeRange, ignoreId?: string): Block | null {
  throw new Error(`findConflict(${blocks.length}, ${JSON.stringify(candidate)}, ${ignoreId}) not implemented`)
}
