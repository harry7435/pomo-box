import type { Category, CategoryRepository } from '@pomobox/core'
import { DEFAULT_CATEGORIES } from '@pomobox/core'
import { asc, isNull } from 'drizzle-orm'
import { categories } from '../db/schema'
import type { Database, RepositoryDeps } from './types'

export function seedDefaultCategories(db: Database, now: () => number = Date.now): void {
  const existing = db.select({ id: categories.id }).from(categories).limit(1).all()
  if (existing.length > 0) return
  const timestamp = now()
  db.insert(categories)
    .values(DEFAULT_CATEGORIES.map((c) => ({ ...c, createdAt: timestamp, updatedAt: timestamp, deletedAt: null })))
    .run()
}

export function createCategoryRepository({ db, subscribe }: RepositoryDeps): CategoryRepository {
  function loadAll(): Category[] {
    return db.select().from(categories).where(isNull(categories.deletedAt)).orderBy(asc(categories.sortOrder)).all()
  }

  return {
    observeAll(onChange) {
      let last = ''
      const emit = () => {
        const list = loadAll()
        const snapshot = JSON.stringify(list)
        if (snapshot === last) return
        last = snapshot
        onChange(list)
      }
      emit()
      return subscribe('categories', emit)
    },
  }
}
