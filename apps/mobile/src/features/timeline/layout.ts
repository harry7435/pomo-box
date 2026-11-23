import type { Block } from '@pomobox/core'
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

/** 화면 진입 시 스크롤 y. 오늘이면 현재 시각을 위에서 1/3, 다른 날이면 첫 블록, 없으면 06:00. */
export function entryScrollY(opts: { isToday: boolean; now: Date; blocks: Block[]; windowHeight: number }): number {
  const { isToday, now, blocks, windowHeight } = opts
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const targetMin = isToday ? nowMin : (blocks[0]?.startMin ?? DAY_START_MIN)
  const offset = isToday ? windowHeight / 3 : 16
  return Math.max(0, topOf(targetMin) - offset)
}
