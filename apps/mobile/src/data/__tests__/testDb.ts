import BetterSqlite from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'path'
import * as schema from '../../db/schema'
import type { Database, Subscribe, TableName } from '../types'

export function createTestDb() {
  const sqlite = new BetterSqlite(':memory:')
  const db = drizzle(sqlite, { schema, casing: 'snake_case' })
  migrate(db, { migrationsFolder: path.join(__dirname, '../../db/migrations') })

  const listeners = new Map<TableName, Set<() => void>>()
  const subscribe: Subscribe = (table, listener) => {
    const set = listeners.get(table) ?? new Set()
    set.add(listener)
    listeners.set(table, set)
    return () => {
      set.delete(listener)
    }
  }
  const notify = (table: TableName) => {
    listeners.get(table)?.forEach((listener) => listener())
  }

  let clock = 1_000
  let sequence = 0
  return {
    db: db as unknown as Database,
    subscribe,
    notify,
    now: () => ++clock,
    newId: () => `id-${++sequence}`,
  }
}
