/** @jest-environment node */
import { createCategoryRepository, seedDefaultCategories } from '../categoryRepository'
import { createTestDb } from './testDb'

describe('categoryRepository', () => {
  it('seeds the five default categories once', () => {
    const { db, subscribe, now } = createTestDb()
    seedDefaultCategories(db, now)
    seedDefaultCategories(db, now)
    const seen: string[][] = []
    createCategoryRepository({ db, subscribe, now }).observeAll((list) => seen.push(list.map((c) => c.name)))
    expect(seen).toEqual([['업무', '공부', '운동', '생활', '휴식']])
  })

  it('keeps fixed ids and color keys from core', () => {
    const { db, subscribe, now } = createTestDb()
    seedDefaultCategories(db, now)
    let first: { id: string; color: string } | undefined
    createCategoryRepository({ db, subscribe, now }).observeAll((list) => {
      first = list[0]
    })
    expect(first).toMatchObject({ id: 'cat-work', color: 'blue' })
  })

  it('emits again when categories change', () => {
    const { db, subscribe, notify, now } = createTestDb()
    const counts: number[] = []
    createCategoryRepository({ db, subscribe, now }).observeAll((list) => counts.push(list.length))
    seedDefaultCategories(db, now)
    notify('categories')
    expect(counts).toEqual([0, 5])
  })
})
