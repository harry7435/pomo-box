/** @jest-environment node */
import { blocks } from '../../db/schema'
import { createBlockRepository } from '../blockRepository'
import { createTestDb } from './testDb'

function setup() {
  const testDb = createTestDb()
  const repo = createBlockRepository(testDb)
  return { ...testDb, repo }
}

const base = { date: '2026-11-18', title: '', categoryId: null }

describe('blockRepository', () => {
  it('creates a planned block with generated id and timestamps', async () => {
    const { repo } = setup()
    const block = await repo.create({ ...base, startMin: 600, endMin: 615, title: '기획서' })
    expect(block).toMatchObject({
      id: 'id-1',
      date: '2026-11-18',
      startMin: 600,
      endMin: 615,
      title: '기획서',
      status: 'planned',
      memo: null,
      deletedAt: null,
    })
    expect(block.createdAt).toBe(block.updatedAt)
  })

  it('emits the day immediately, sorted by start and excluding other dates and deleted blocks', async () => {
    const { repo } = setup()
    await repo.create({ ...base, startMin: 720, endMin: 735 })
    await repo.create({ ...base, startMin: 600, endMin: 615 })
    await repo.create({ ...base, date: '2026-11-19', startMin: 600, endMin: 615 })
    const gone = await repo.create({ ...base, startMin: 900, endMin: 915 })
    await repo.remove(gone.id)

    const seen: number[][] = []
    repo.observeDay('2026-11-18', (list) => seen.push(list.map((b) => b.startMin)))
    expect(seen).toEqual([[600, 720]])
  })

  it('emits again when the day changes', async () => {
    const { repo, notify } = setup()
    const seen: number[] = []
    repo.observeDay('2026-11-18', (list) => seen.push(list.length))
    await repo.create({ ...base, startMin: 600, endMin: 615 })
    notify('blocks')
    expect(seen).toEqual([0, 1])
  })

  it('does not emit when only another day changes', async () => {
    const { repo, notify } = setup()
    const seen: number[] = []
    repo.observeDay('2026-11-18', (list) => seen.push(list.length))
    await repo.create({ ...base, date: '2026-11-19', startMin: 600, endMin: 615 })
    notify('blocks')
    expect(seen).toEqual([0])
  })

  it('stops emitting after unsubscribe', async () => {
    const { repo, notify } = setup()
    const seen: number[] = []
    const unsubscribe = repo.observeDay('2026-11-18', (list) => seen.push(list.length))
    unsubscribe()
    await repo.create({ ...base, startMin: 600, endMin: 615 })
    notify('blocks')
    expect(seen).toEqual([0])
  })

  it('updates fields and bumps updatedAt', async () => {
    const { repo } = setup()
    const created = await repo.create({ ...base, startMin: 600, endMin: 615 })
    const updated = await repo.update(created.id, { status: 'done', endMin: 630, title: '수정' })
    expect(updated).toMatchObject({ status: 'done', endMin: 630, title: '수정', createdAt: created.createdAt })
    expect(updated.updatedAt).toBeGreaterThan(created.updatedAt)
  })

  it('rejects updating a missing block', async () => {
    const { repo } = setup()
    await expect(repo.update('missing', { title: 'x' })).rejects.toThrow('block not found: missing')
  })

  it('soft-deletes by setting deletedAt', async () => {
    const { repo, db } = setup()
    const created = await repo.create({ ...base, startMin: 600, endMin: 615 })
    await repo.remove(created.id)
    const rows = db.select().from(blocks).all()
    expect(rows).toHaveLength(1)
    expect(rows[0].deletedAt).not.toBeNull()
  })
})
