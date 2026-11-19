import { BLOCK_UNIT_MIN, DAY_END_MIN, DAY_START_MIN, minToPx, pxToMin, snapMin } from '@pomobox/core'

export const PX_PER_MIN = 2.4

export function timelineHeight(): number {
  return minToPx(DAY_END_MIN - DAY_START_MIN, PX_PER_MIN)
}

export function topOf(min: number): number {
  return minToPx(min - DAY_START_MIN, PX_PER_MIN)
}

/** 타임라인 안의 y 좌표를 그 칸의 시작 분으로. 마지막 칸 뒤는 마지막 칸으로 맞춘다. */
export function tapToStartMin(y: number): number {
  const offset = snapMin(pxToMin(Math.max(0, y), PX_PER_MIN), BLOCK_UNIT_MIN)
  return Math.min(DAY_START_MIN + offset, DAY_END_MIN - BLOCK_UNIT_MIN)
}
