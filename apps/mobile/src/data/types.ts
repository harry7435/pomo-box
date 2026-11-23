import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import type * as schema from '../db/schema'

export type Database = BaseSQLiteDatabase<'sync', unknown, typeof schema>
export type TableName = 'blocks' | 'categories'
export type Subscribe = (table: TableName, listener: () => void) => () => void

export type RepositoryDeps = {
  db: Database
  subscribe: Subscribe
  now?: () => number
  newId?: () => string
}
