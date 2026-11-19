import type { Block, BlockPatch, Category, NewBlock } from './types'

export interface BlockRepository {
  /** 해당 날짜의 삭제되지 않은 블록을 시작 시각 순으로 즉시 한 번, 이후 바뀔 때마다 알린다. 반환값은 구독 해제 함수. */
  observeDay(date: string, onChange: (blocks: Block[]) => void): () => void
  create(input: NewBlock): Promise<Block>
  update(id: string, patch: BlockPatch): Promise<Block>
  /** 소프트 삭제(deletedAt만 채운다). */
  remove(id: string): Promise<void>
}

export interface CategoryRepository {
  /** 삭제되지 않은 카테고리를 sortOrder 순으로 즉시 한 번, 이후 바뀔 때마다 알린다. */
  observeAll(onChange: (categories: Category[]) => void): () => void
}
