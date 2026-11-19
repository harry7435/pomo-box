import type { Block, BlockRepository } from '@pomobox/core'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { blocks } from '../db/schema'
import type { RepositoryDeps } from './types'

type BlockRow = typeof blocks.$inferSelect

function toBlock(row: BlockRow): Block {
  return { ...row, status: row.status as Block['status'] }
}

export function createBlockRepository({
  db,
  subscribe,
  now = Date.now,
  newId,
}: RepositoryDeps): BlockRepository {
  if (!newId) throw new Error('createBlockRepository: newId is required')
  const makeId = newId

  function loadDay(date: string): Block[] {
    return db
      .select()
      .from(blocks)
      .where(and(eq(blocks.date, date), isNull(blocks.deletedAt)))
      .orderBy(asc(blocks.startMin))
      .all()
      .map(toBlock)
  }

  function findById(id: string): Block | undefined {
    const row = db.select().from(blocks).where(eq(blocks.id, id)).get()
    return row ? toBlock(row) : undefined
  }

  return {
    observeDay(date, onChange) {
      let last = ''
      const emit = () => {
        const list = loadDay(date)
        const snapshot = JSON.stringify(list)
        if (snapshot === last) return
        last = snapshot
        onChange(list)
      }
      emit()
      return subscribe('blocks', emit)
    },

    async create(input) {
      const timestamp = now()
      const row: Block = {
        id: makeId(),
        date: input.date,
        startMin: input.startMin,
        endMin: input.endMin,
        title: input.title,
        categoryId: input.categoryId,
        status: input.status ?? 'planned',
        memo: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        deletedAt: null,
      }
      db.insert(blocks).values(row).run()
      return row
    },

    async update(id, patch) {
      db.update(blocks)
        .set({ ...patch, updatedAt: now() })
        .where(eq(blocks.id, id))
        .run()
      const updated = findById(id)
      if (!updated) throw new Error(`block not found: ${id}`)
      return updated
    },

    async remove(id) {
      const timestamp = now()
      db.update(blocks).set({ deletedAt: timestamp, updatedAt: timestamp }).where(eq(blocks.id, id)).run()
    },
  }
}
