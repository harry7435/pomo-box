import type { Block, BlockRuleError, BlockStatus } from '@pomobox/core'
import { BLOCK_UNIT_MIN, DAY_END_MIN, DAY_START_MIN, formatMin } from '@pomobox/core'

export const DURATION_CHIPS = [15, 30, 45, 60, 90] as const

export type Draft = {
  startMin: number
  endMin: number
  title: string
  categoryId: string | null
  status: BlockStatus
}

export function draftFromNew(startMin: number): Draft {
  return { startMin, endMin: startMin + BLOCK_UNIT_MIN, title: '', categoryId: null, status: 'planned' }
}

export function draftFromBlock(block: Block): Draft {
  const { startMin, endMin, title, categoryId, status } = block
  return { startMin, endMin, title, categoryId, status }
}

export function canShift(draft: Draft, delta: number): boolean {
  return draft.startMin + delta >= DAY_START_MIN && draft.endMin + delta <= DAY_END_MIN
}

export function shiftStart(draft: Draft, delta: number): Draft {
  return { ...draft, startMin: draft.startMin + delta, endMin: draft.endMin + delta }
}

export function canSetDuration(draft: Draft, minutes: number): boolean {
  return draft.startMin + minutes <= DAY_END_MIN
}

export function setDuration(draft: Draft, minutes: number): Draft {
  return { ...draft, endMin: draft.startMin + minutes }
}

export function ruleErrorMessage(error: BlockRuleError): string {
  switch (error.code) {
    case 'OVERLAP': {
      const { startMin, endMin, title } = error.conflict
      return `${formatMin(startMin)}–${formatMin(endMin)} '${title || '제목 없음'}'과 겹쳐요`
    }
    case 'OUT_OF_DAY_RANGE':
      return '06:00~24:00 안에서만 만들 수 있어요'
    case 'END_NOT_AFTER_START':
      return '끝 시각이 시작 시각보다 늦어야 해요'
    case 'NOT_ALIGNED_TO_UNIT':
      return '15분 단위로만 정할 수 있어요'
  }
}
