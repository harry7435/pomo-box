export type BlockStatus = 'planned' | 'done' | 'partial' | 'skipped'

export const BLOCK_STATUSES: readonly BlockStatus[] = ['planned', 'done', 'partial', 'skipped']

export type TimeRange = {
  startMin: number
  endMin: number
}

export type Block = TimeRange & {
  id: string
  date: string
  title: string
  categoryId: string | null
  status: BlockStatus
  memo: string | null
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export type Category = {
  id: string
  name: string
  color: string
  sortOrder: number
  createdAt: number
  updatedAt: number
  deletedAt: number | null
}

export type NewBlock = Pick<Block, 'date' | 'startMin' | 'endMin' | 'title' | 'categoryId'> & {
  status?: BlockStatus
}

export type BlockPatch = Partial<Pick<Block, 'startMin' | 'endMin' | 'title' | 'categoryId' | 'status' | 'memo'>>
