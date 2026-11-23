import { BLOCK_UNIT_MIN, DAY_END_MIN, DAY_START_MIN } from './config'
import { findConflict } from './time'
import type { Block, TimeRange } from './types'

export type BlockRuleError =
  | { code: 'END_NOT_AFTER_START' }
  | { code: 'OUT_OF_DAY_RANGE' }
  | { code: 'NOT_ALIGNED_TO_UNIT' }
  | { code: 'OVERLAP'; conflict: Block }

export function validateBlockInput(
  input: TimeRange,
  existing: readonly Block[],
  ignoreId?: string,
): BlockRuleError[] {
  const errors: BlockRuleError[] = []
  if (input.endMin <= input.startMin) errors.push({ code: 'END_NOT_AFTER_START' })
  if (input.startMin < DAY_START_MIN || input.endMin > DAY_END_MIN) errors.push({ code: 'OUT_OF_DAY_RANGE' })
  if (input.startMin % BLOCK_UNIT_MIN !== 0 || input.endMin % BLOCK_UNIT_MIN !== 0) {
    errors.push({ code: 'NOT_ALIGNED_TO_UNIT' })
  }
  const conflict = findConflict(existing, input, ignoreId)
  if (conflict) errors.push({ code: 'OVERLAP', conflict })
  return errors
}
