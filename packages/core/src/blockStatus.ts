import type { BlockStatus } from './types'

/** 블록의 동그라미를 탭했을 때의 다음 상태. 부분·건너뜀은 완료로 올린다. */
export function nextQuickStatus(status: BlockStatus): BlockStatus {
  return status === 'done' ? 'planned' : 'done'
}
