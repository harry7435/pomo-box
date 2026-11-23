// drizzle-kit이 이 파일을 직접 로드하므로 워크스페이스 패키지(@pomobox/core)를 import하지 않는다.
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const categories = sqliteTable('categories', {
  id: text().primaryKey(),
  name: text().notNull(),
  color: text().notNull(),
  sortOrder: integer().notNull(),
  createdAt: integer().notNull(),
  updatedAt: integer().notNull(),
  deletedAt: integer(),
})

export const blocks = sqliteTable(
  'blocks',
  {
    id: text().primaryKey(),
    date: text().notNull(),
    startMin: integer().notNull(),
    endMin: integer().notNull(),
    title: text().notNull(),
    categoryId: text().references(() => categories.id),
    status: text({ enum: ['planned', 'done', 'partial', 'skipped'] }).notNull(),
    memo: text(),
    createdAt: integer().notNull(),
    updatedAt: integer().notNull(),
    deletedAt: integer(),
  },
  (table) => [index('blocks_date_start_min_idx').on(table.date, table.startMin)],
)
