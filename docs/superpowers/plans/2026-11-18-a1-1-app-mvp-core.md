# A1-1 · 앱 MVP (저장소·타임라인·블록 CRUD) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 폰에서 하루를 15분 블록으로 계획·수정·삭제하고 완료를 체크할 수 있는 Pomobox 앱 MVP를 만든다(알림 제외).

**Architecture:** `@pomobox/core`에 도메인 타입·규칙·날짜·시간 계산·저장소 인터페이스를 둔다(`time.ts`는 사용자가 직접 구현). 앱은 expo-sqlite + Drizzle로 저장하고, 저장소는 `({ db, subscribe })`를 받아 구독형 `observeDay`를 제공한다. 화면은 저장소 구독 결과를 그리고, UI 상태만 Zustand에 둔다. 편집은 `@gorhom/bottom-sheet` 안의 폼에서 임시 값으로 하다가 "저장" 시 기록한다.

**Tech Stack:** Expo SDK 58, React Native 0.88, Expo Router, expo-sqlite, Drizzle ORM + drizzle-kit, @gorhom/bottom-sheet, Zustand, date-fns, Vitest(core), Jest + RN Testing Library + better-sqlite3(app)

**Spec:** `docs/superpowers/specs/2026-11-18-a1-1-app-mvp-core-design.md`

## Global Constraints

- 작업 디렉터리 `/Users/jun2/develop/pomobox`, 브랜치 `a1-app-mvp`. push 금지.
- npm workspaces. lock 파일은 루트 하나. Expo 네이티브 의존성은 `apps/mobile`에서 `npx expo install`, 그 외는 `npm install -w <workspace>`.
- React `19.3.0` 유지(`npm ls react`에 다른 버전 금지).
- `@pomobox/core` 경계 규칙을 지킨다(React·RN·Expo·브라우저 전역 금지, 내부 import는 확장자 없이).
- 상수: `BLOCK_UNIT_MIN = 15`, `DAY_START_MIN = 360`, `DAY_END_MIN = 1440`, `PX_PER_MIN = 2.4`, 길이 칩 `[15, 30, 45, 60, 90]`.
- 상태 값: `'planned' | 'done' | 'partial' | 'skipped'`. 빠른 토글: planned→done, done→planned, partial/skipped→done.
- 시간 구간은 반열린 `[startMin, endMin)`. 맞닿음은 겹침 아님.
- DB 칼럼은 snake_case(Drizzle `casing: 'snake_case'`), TS 필드는 camelCase. 시각 값은 epoch ms 정수.
- 스키마 변경은 `drizzle-kit generate`로만.
- 스타일은 RN `StyleSheet`(NativeWind 금지). 코드 스타일: 작은따옴표, 세미콜론 없음.
- 사용자 문구는 한국어. 오류 문구는 spec 4.3 그대로.
- `packages/core/src/time.ts`의 함수 본문은 **사용자가 직접 작성**한다. 서브에이전트는 시그니처 스텁과 테스트만 만든다.
- 커밋 메시지는 한글(접두어 유지), **Co-Authored-By 등 트레일러 금지**. 커밋 전 루트 `npm run check` 통과.

## Review Focus

- 다른 날짜의 블록이 바뀌어도 화면이 다시 그려지면 안 된다(구독 범위) → 저장소 테스트 "다른 날짜 변경 시 미알림"(Task 3).
- 실수 탭으로 빈 블록이 DB에 쌓이면 안 된다 → 새 블록은 임시 값, "저장" 시에만 `create`(Task 6 폼·시트, 테스트 "저장 전에는 create 미호출").
- 23:45 이후 칸을 탭하거나 길이 칩으로 24:00을 넘기면 범위 밖 블록이 생기면 안 된다 → 탭 위치 클램프와 칩 비활성(Task 5·6 테스트).
- 편집 중인 블록 자신과 겹친다고 저장이 막히면 안 된다 → `ignoreId`(Task 4 규칙 테스트, Task 6 폼 테스트).
- 자정을 넘겨 앱을 다시 열었을 때 어제를 "오늘"로 보여주면 안 된다 → `followToday` + AppState(Task 5 uiStore 테스트).

---

## Part A · 위임 작업과 직접 작업

### Task 1: core 기반 (타입·설정·날짜·저장소 인터페이스, `time.ts` 스텁과 테스트)

**Files:**
- Create: `packages/core/src/types.ts`, `packages/core/src/date.ts`, `packages/core/src/date.test.ts`, `packages/core/src/repository.ts`, `packages/core/src/time.ts`, `packages/core/src/time.test.ts`
- Modify: `packages/core/src/config.ts`, `packages/core/src/index.ts`, `packages/core/package.json`

**Interfaces:**
- Produces: 타입 `BlockStatus`, `BLOCK_STATUSES`, `Block`, `Category`, `NewBlock`, `BlockPatch`, `TimeRange`; `DEFAULT_CATEGORIES`; `isDateString(s)`, `addDays(date, n)`, `todayString(now: Date)`, `formatDateLabel(date)`; 인터페이스 `BlockRepository`, `CategoryRepository`; 스텁 `formatMin`, `snapMin`, `minToPx`, `pxToMin`, `overlaps`, `findConflict`.

- [ ] **Step 1: date-fns 설치**

```bash
cd /Users/jun2/develop/pomobox
npm install -w @pomobox/core date-fns
```

- [ ] **Step 2: `packages/core/src/types.ts`**

```ts
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
```

- [ ] **Step 3: `config.ts`에 기본 카테고리 추가**

`packages/core/src/config.ts` 끝에 추가:

```ts
// 첫 실행 때 넣는 기본 카테고리. id는 기기마다 같아야 나중에 동기화할 때 같은 카테고리로 합쳐진다.
export const DEFAULT_CATEGORIES = [
  { id: 'cat-work', name: '업무', color: 'blue', sortOrder: 0 },
  { id: 'cat-study', name: '공부', color: 'purple', sortOrder: 1 },
  { id: 'cat-exercise', name: '운동', color: 'green', sortOrder: 2 },
  { id: 'cat-life', name: '생활', color: 'orange', sortOrder: 3 },
  { id: 'cat-rest', name: '휴식', color: 'gray', sortOrder: 4 },
] as const
```

- [ ] **Step 4: date 실패 테스트**

`packages/core/src/date.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { addDays, formatDateLabel, isDateString, todayString } from './date'

describe('isDateString', () => {
  it.each(['2026-11-18', '2024-02-29', '2026-01-01'])('accepts %s', (value) => {
    expect(isDateString(value)).toBe(true)
  })

  it.each(['2026-11-31', '2026-02-29', '2026-1-18', '20261118', '', '2026-13-01'])('rejects %p', (value) => {
    expect(isDateString(value)).toBe(false)
  })
})

describe('addDays', () => {
  it('moves forward and backward by days', () => {
    expect(addDays('2026-11-18', 1)).toBe('2026-11-19')
    expect(addDays('2026-11-18', -1)).toBe('2026-11-17')
  })

  it('crosses month, year and leap-day boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('todayString', () => {
  it('formats the local date of the given moment', () => {
    expect(todayString(new Date(2026, 10, 18, 23, 59))).toBe('2026-11-18')
    expect(todayString(new Date(2026, 10, 19, 0, 0))).toBe('2026-11-19')
  })
})

describe('formatDateLabel', () => {
  it('formats month, day and Korean weekday', () => {
    expect(formatDateLabel('2026-11-18')).toBe('11월 18일 (수)')
    expect(formatDateLabel('2027-01-03')).toBe('1월 3일 (일)')
  })
})
```

Run: `npm exec -w @pomobox/core -- vitest run src/date.test.ts`
Expected: FAIL — `Cannot find module './date'` 또는 export 없음.

- [ ] **Step 5: `packages/core/src/date.ts`**

```ts
import { addDays as addDaysToDate, format, isValid, parse } from 'date-fns'
import { ko } from 'date-fns/locale'

const DATE_FORMAT = 'yyyy-MM-dd'
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parseDate(date: string): Date {
  return parse(date, DATE_FORMAT, new Date(2000, 0, 1))
}

export function isDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const parsed = parseDate(value)
  return isValid(parsed) && format(parsed, DATE_FORMAT) === value
}

export function addDays(date: string, amount: number): string {
  return format(addDaysToDate(parseDate(date), amount), DATE_FORMAT)
}

export function todayString(now: Date): string {
  return format(now, DATE_FORMAT)
}

export function formatDateLabel(date: string): string {
  return format(parseDate(date), 'M월 d일 (EEEEE)', { locale: ko })
}
```

Run: `npm exec -w @pomobox/core -- vitest run src/date.test.ts`
Expected: PASS. 요일 토큰이 `(수)`가 아니라 `(수요일)` 등으로 나오면 date-fns ko 로케일에 맞는 토큰(`EEEEE` 또는 `EEE`)으로 바꾸되 테스트 기대값은 그대로 둔다.

- [ ] **Step 6: `packages/core/src/repository.ts`**

```ts
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
```

- [ ] **Step 7: `time.ts` 스텁 (본문은 사용자가 작성)**

`packages/core/src/time.ts`:

```ts
import type { Block, TimeRange } from './types'

// 이 파일의 함수 본문은 직접 작성한다(docs/guides/working-agreement.md). 테스트: time.test.ts

/** 자정부터의 분을 "HH:MM"으로. 1440은 "24:00". */
export function formatMin(min: number): string {
  throw new Error(`formatMin(${min}) not implemented`)
}

/** 분을 unit 단위로 내림. snapMin(607, 15) === 600 */
export function snapMin(min: number, unit: number): number {
  throw new Error(`snapMin(${min}, ${unit}) not implemented`)
}

/** 분 길이를 화면 픽셀로. */
export function minToPx(min: number, pxPerMin: number): number {
  throw new Error(`minToPx(${min}, ${pxPerMin}) not implemented`)
}

/** 화면 픽셀을 분으로(소수점 내림). */
export function pxToMin(px: number, pxPerMin: number): number {
  throw new Error(`pxToMin(${px}, ${pxPerMin}) not implemented`)
}

/** 반열린 구간 [start, end)끼리 겹치는지. 맞닿음은 겹침 아님. */
export function overlaps(a: TimeRange, b: TimeRange): boolean {
  throw new Error(`overlaps(${JSON.stringify(a)}, ${JSON.stringify(b)}) not implemented`)
}

/** candidate와 겹치는 블록 중 시작 시각이 가장 이른 것. ignoreId와 같은 블록, 삭제된 블록은 제외. 없으면 null. */
export function findConflict(blocks: readonly Block[], candidate: TimeRange, ignoreId?: string): Block | null {
  throw new Error(`findConflict(${blocks.length}, ${JSON.stringify(candidate)}, ${ignoreId}) not implemented`)
}
```

- [ ] **Step 8: `time.ts` 테스트 (사용자가 `.skip`을 지우고 통과시킨다)**

`packages/core/src/time.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { findConflict, formatMin, minToPx, overlaps, pxToMin, snapMin } from './time'
import type { Block } from './types'

// 직접 구현할 때 아래 describe.skip을 describe로 바꾸고 통과시킨다.

function block(id: string, startMin: number, endMin: number, deletedAt: number | null = null): Block {
  return {
    id,
    date: '2026-11-18',
    startMin,
    endMin,
    title: id,
    categoryId: null,
    status: 'planned',
    memo: null,
    createdAt: 0,
    updatedAt: 0,
    deletedAt,
  }
}

describe.skip('time', () => {
  describe('formatMin', () => {
    it.each([
      [0, '00:00'],
      [5, '00:05'],
      [360, '06:00'],
      [615, '10:15'],
      [1439, '23:59'],
      [1440, '24:00'],
    ])('formats %i as %s', (min, expected) => {
      expect(formatMin(min)).toBe(expected)
    })
  })

  describe('snapMin', () => {
    it.each([
      [600, 15, 600],
      [607, 15, 600],
      [614, 15, 600],
      [615, 15, 615],
      [29, 30, 0],
      [0, 15, 0],
    ])('snaps %i to unit %i as %i (floor)', (min, unit, expected) => {
      expect(snapMin(min, unit)).toBe(expected)
    })
  })

  describe('minToPx / pxToMin', () => {
    it('converts minutes to pixels linearly', () => {
      expect(minToPx(0, 2.4)).toBe(0)
      expect(minToPx(15, 2.4)).toBeCloseTo(36)
      expect(minToPx(60, 2.4)).toBeCloseTo(144)
    })

    it('converts pixels to whole minutes, rounding down', () => {
      expect(pxToMin(0, 2.4)).toBe(0)
      expect(pxToMin(36, 2.4)).toBe(15)
      expect(pxToMin(35.9, 2.4)).toBe(14)
      expect(pxToMin(144, 2.4)).toBe(60)
    })

    it('round-trips whole minutes', () => {
      for (const min of [0, 15, 90, 1080]) {
        expect(pxToMin(minToPx(min, 2.4), 2.4)).toBe(min)
      }
    })
  })

  describe('overlaps', () => {
    it('detects overlapping ranges', () => {
      expect(overlaps({ startMin: 600, endMin: 660 }, { startMin: 630, endMin: 690 })).toBe(true)
      expect(overlaps({ startMin: 600, endMin: 690 }, { startMin: 615, endMin: 630 })).toBe(true)
      expect(overlaps({ startMin: 615, endMin: 630 }, { startMin: 600, endMin: 690 })).toBe(true)
      expect(overlaps({ startMin: 600, endMin: 615 }, { startMin: 600, endMin: 615 })).toBe(true)
    })

    it('treats touching ranges as not overlapping', () => {
      expect(overlaps({ startMin: 600, endMin: 615 }, { startMin: 615, endMin: 630 })).toBe(false)
      expect(overlaps({ startMin: 615, endMin: 630 }, { startMin: 600, endMin: 615 })).toBe(false)
    })

    it('treats separate ranges as not overlapping', () => {
      expect(overlaps({ startMin: 600, endMin: 615 }, { startMin: 700, endMin: 715 })).toBe(false)
    })
  })

  describe('findConflict', () => {
    const blocks = [block('c', 720, 750), block('a', 600, 630), block('b', 630, 660)]

    it('returns null when nothing overlaps', () => {
      expect(findConflict(blocks, { startMin: 660, endMin: 720 })).toBeNull()
    })

    it('returns the earliest overlapping block regardless of input order', () => {
      expect(findConflict(blocks, { startMin: 615, endMin: 735 })?.id).toBe('a')
    })

    it('ignores the block being edited', () => {
      expect(findConflict(blocks, { startMin: 600, endMin: 630 }, 'a')).toBeNull()
      expect(findConflict(blocks, { startMin: 600, endMin: 645 }, 'a')?.id).toBe('b')
    })

    it('ignores deleted blocks', () => {
      const withDeleted = [block('gone', 600, 630, 123)]
      expect(findConflict(withDeleted, { startMin: 600, endMin: 615 })).toBeNull()
    })

    it('returns null for an empty list', () => {
      expect(findConflict([], { startMin: 600, endMin: 615 })).toBeNull()
    })
  })
})
```

- [ ] **Step 9: index export와 검사**

`packages/core/src/index.ts`:

```ts
export { BLOCK_UNIT_MIN, DAY_END_MIN, DAY_START_MIN, DEFAULT_CATEGORIES } from './config'
export { addDays, formatDateLabel, isDateString, todayString } from './date'
export type { BlockRepository, CategoryRepository } from './repository'
export { findConflict, formatMin, minToPx, overlaps, pxToMin, snapMin } from './time'
export { BLOCK_STATUSES } from './types'
export type { Block, BlockPatch, BlockStatus, Category, NewBlock, TimeRange } from './types'
```

```bash
cd /Users/jun2/develop/pomobox
npm run check; echo "exit=$?"
```

Expected: `exit=0`. time 테스트는 skipped로 표시된다.

- [ ] **Step 10: Commit**

```bash
git add packages/core package.json package-lock.json
git commit -m "feat: core에 블록 타입·날짜 함수·저장소 인터페이스와 time.ts 스텁·테스트 추가"
```

---

### 직접 작업 B-1: `time.ts` 구현 (Task 1 이후, Task 2·3과 병행)

- [ ] `packages/core/src/time.test.ts`의 `describe.skip`을 `describe`로 바꾼다.
- [ ] `npm exec -w @pomobox/core -- vitest --watch src/time.test.ts`를 켜 두고 `time.ts`의 함수 본문을 하나씩 구현한다.
- [ ] `npm run check` 통과 후 커밋: `feat: time.ts 시간 계산 함수 구현`.
- [ ] 막히면 Claude에게 "time.ts 힌트" 요청. Claude는 답 대신 접근 방법과 리뷰만 준다.

Task 4 이후는 이 작업이 끝나야 시작한다.

---

### Task 2: Drizzle 설정과 첫 마이그레이션

**Files:**
- Create: `apps/mobile/babel.config.js`, `apps/mobile/metro.config.js`, `apps/mobile/drizzle.config.ts`, `apps/mobile/src/db/schema.ts`, `apps/mobile/src/db/client.ts`, `apps/mobile/src/db/migrations/*`(생성)
- Modify: `apps/mobile/package.json`, `package-lock.json`

**Interfaces:**
- Consumes: 없음 (상태 값은 Global Constraints와 동일하게 리터럴로)
- Produces: `schema.ts`의 `blocks`, `categories` 테이블; `client.ts`의 `expoDb`, `db`; `src/db/migrations/migrations.js`(기본 export). 스크립트 `db:generate`.

- [ ] **Step 1: 의존성 설치**

```bash
cd /Users/jun2/develop/pomobox/apps/mobile
npx expo install expo-sqlite
cd ../..
npm install -w @pomobox/mobile drizzle-orm
npm install -D -w @pomobox/mobile drizzle-kit babel-plugin-inline-import
find . -name package-lock.json -not -path '*/node_modules/*'
```

Expected: 루트 lock 하나만. 하위 lock이 생기면 지우고 루트에서 `npm install`.

- [ ] **Step 2: Babel·Metro 설정 (`.sql` 번들링)**

`apps/mobile/babel.config.js`:

```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  }
}
```

`apps/mobile/metro.config.js`:

```js
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
// drizzle-kit이 만든 마이그레이션 .sql 파일을 번들에 포함한다.
config.resolver.sourceExts.push('sql')

module.exports = config
```

- [ ] **Step 3: 스키마와 drizzle-kit 설정**

`apps/mobile/src/db/schema.ts`:

```ts
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
```

enum 값은 core의 `BLOCK_STATUSES`와 같은 네 값, 같은 순서로 쓴다.

`apps/mobile/drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  casing: 'snake_case',
})
```

`apps/mobile/package.json` scripts에 추가: `"db:generate": "drizzle-kit generate"`

- [ ] **Step 4: DB 클라이언트**

`apps/mobile/src/db/client.ts`:

```ts
import { drizzle } from 'drizzle-orm/expo-sqlite'
import { openDatabaseSync } from 'expo-sqlite'
import * as schema from './schema'

export const expoDb = openDatabaseSync('pomobox.db', { enableChangeListener: true })

export const db = drizzle(expoDb, { schema, casing: 'snake_case' })
```

- [ ] **Step 5: 첫 마이그레이션 생성**

```bash
cd /Users/jun2/develop/pomobox
npm run db:generate -w @pomobox/mobile
ls apps/mobile/src/db/migrations apps/mobile/src/db/migrations/meta
grep -n "CREATE TABLE\|CREATE INDEX" apps/mobile/src/db/migrations/*.sql
```

Expected: `0000_*.sql`, `migrations.js`, `meta/_journal.json`. SQL에 `start_min`, `sort_order`, `blocks_date_start_min_idx`가 snake_case로 있다.

- [ ] **Step 6: 번들 검증**

`migrations.js`가 `.sql`을 import하므로 실제 번들에 들어가는지 확인한다. 임시로 `src/app/index.tsx` 맨 위에 `import migrations from '../db/migrations/migrations'`와 `console.log(Object.keys(migrations))`를 넣고:

```bash
cd /Users/jun2/develop/pomobox/apps/mobile
npx expo export --platform android --output-dir /private/tmp/claude-501/-Users-jun2-develop-pomobox/d4a8f4c6-0de9-4d79-943e-c3880fc4370c/scratchpad/a1-export
```

Expected: 오류 없이 번들 생성. 확인 후 임시 import와 console.log를 **되돌린다**.

- [ ] **Step 7: 검사와 Commit**

```bash
cd /Users/jun2/develop/pomobox
npm run check; echo "exit=$?"
npm ls react
git add apps/mobile package-lock.json
git commit -m "feat: 앱에 expo-sqlite와 Drizzle 스키마·첫 마이그레이션 추가"
```

`expo lint`가 `src/db/migrations/*.js`(생성물)를 지적하면 `apps/mobile/eslint.config.js`의 ignores에 `src/db/migrations/**`를 추가한다.

---

### Task 3: 저장소 구현과 테스트

**Files:**
- Create: `apps/mobile/src/data/types.ts`, `apps/mobile/src/data/blockRepository.ts`, `apps/mobile/src/data/categoryRepository.ts`, `apps/mobile/src/data/expoSubscribe.ts`, `apps/mobile/src/data/RepositoryProvider.tsx`, `apps/mobile/src/data/__tests__/testDb.ts`, `apps/mobile/src/data/__tests__/blockRepository.test.ts`, `apps/mobile/src/data/__tests__/categoryRepository.test.ts`
- Modify: `apps/mobile/package.json`, `package-lock.json`

**Interfaces:**
- Consumes: Task 1 core 타입·인터페이스·`DEFAULT_CATEGORIES`, Task 2 `schema`, 마이그레이션 폴더
- Produces: `createBlockRepository(deps): BlockRepository`, `createCategoryRepository(deps): CategoryRepository`, `seedDefaultCategories(db, now)`, `expoSubscribe: Subscribe`, `RepositoryProvider({ value, children })`, `useRepositories(): { blocks: BlockRepository; categories: CategoryRepository }`, 타입 `Database`, `Subscribe`, `TableName`, `RepositoryDeps`.

- [ ] **Step 1: 테스트 의존성**

```bash
cd /Users/jun2/develop/pomobox
cd apps/mobile && npx expo install expo-crypto && cd ../..
npm install -D -w @pomobox/mobile better-sqlite3 @types/better-sqlite3
```

`better-sqlite3`가 Node 버전에 맞는 바이너리를 못 받아 빌드에 실패하면 오류를 보고서에 붙이고 BLOCKED로 보고한다.

- [ ] **Step 2: 공용 타입과 테스트 DB 헬퍼**

`apps/mobile/src/data/types.ts`:

```ts
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
```

better-sqlite3 DB가 `Database`에 할당되지 않으면 두 번째 타입 인자를 `any`로 넓힌다(주석으로 이유를 남긴다).

`apps/mobile/src/data/__tests__/testDb.ts`:

```ts
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
```

`testDb.ts`가 Jest 테스트로 잡히지 않도록 `apps/mobile/package.json`의 `jest`에 `"testPathIgnorePatterns": ["/node_modules/", "/__tests__/testDb\\.ts$"]`를 추가한다.

- [ ] **Step 3: 블록 저장소 실패 테스트**

`apps/mobile/src/data/__tests__/blockRepository.test.ts`:

```ts
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
```

Run: `cd apps/mobile && npx jest src/data/__tests__/blockRepository.test.ts`
Expected: FAIL — `Cannot find module '../blockRepository'`

- [ ] **Step 4: `blockRepository.ts`**

```ts
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
```

`observeDay`의 첫 emit은 빈 목록이어도 반드시 호출해야 한다(`last` 초기값 `''`과 `'[]'`가 달라서 호출된다).

Run: `npx jest src/data/__tests__/blockRepository.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: 카테고리 저장소 실패 테스트**

`apps/mobile/src/data/__tests__/categoryRepository.test.ts`:

```ts
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
```

Run: `npx jest src/data/__tests__/categoryRepository.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 6: `categoryRepository.ts`**

```ts
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
```

Run: `npx jest src/data/__tests__`
Expected: PASS (11 tests)

- [ ] **Step 7: expo 구독 어댑터와 Provider**

`apps/mobile/src/data/expoSubscribe.ts`:

```ts
import { addDatabaseChangeListener } from 'expo-sqlite'
import type { Subscribe } from './types'

// expo-sqlite의 변경 이벤트를 테이블 단위 구독으로 바꾼다. DB는 enableChangeListener로 열려 있어야 한다.
export const expoSubscribe: Subscribe = (table, listener) => {
  const subscription = addDatabaseChangeListener((event) => {
    if (event.tableName === table) listener()
  })
  return () => subscription.remove()
}
```

`apps/mobile/src/data/RepositoryProvider.tsx`:

```tsx
import type { BlockRepository, CategoryRepository } from '@pomobox/core'
import { createContext, useContext, type ReactNode } from 'react'

export type Repositories = {
  blocks: BlockRepository
  categories: CategoryRepository
}

const RepositoryContext = createContext<Repositories | null>(null)

export function RepositoryProvider({ value, children }: { value: Repositories; children: ReactNode }) {
  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>
}

export function useRepositories(): Repositories {
  const repositories = useContext(RepositoryContext)
  if (!repositories) throw new Error('useRepositories must be used inside RepositoryProvider')
  return repositories
}
```

- [ ] **Step 8: 검사와 Commit**

```bash
cd /Users/jun2/develop/pomobox
npm run check; echo "exit=$?"
git add apps/mobile package-lock.json
git commit -m "feat: Drizzle 기반 블록·카테고리 저장소와 better-sqlite3 테스트 추가"
```

---

### Task 4: 블록 규칙과 빠른 상태 토글 (B-1 이후)

**Files:**
- Create: `packages/core/src/blockRules.ts`, `packages/core/src/blockRules.test.ts`, `packages/core/src/blockStatus.ts`, `packages/core/src/blockStatus.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: 사용자가 구현한 `findConflict`, `config.ts` 상수
- Produces: `validateBlockInput(input: TimeRange, existing: readonly Block[], ignoreId?: string): BlockRuleError[]`, 타입 `BlockRuleError`, `nextQuickStatus(status: BlockStatus): BlockStatus`.

- [ ] **Step 1: 실패 테스트**

`packages/core/src/blockRules.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { validateBlockInput } from './blockRules'
import type { Block } from './types'

function block(id: string, startMin: number, endMin: number, deletedAt: number | null = null): Block {
  return {
    id,
    date: '2026-11-18',
    startMin,
    endMin,
    title: id,
    categoryId: null,
    status: 'planned',
    memo: null,
    createdAt: 0,
    updatedAt: 0,
    deletedAt,
  }
}

const codes = (errors: ReturnType<typeof validateBlockInput>) => errors.map((e) => e.code)

describe('validateBlockInput', () => {
  it('accepts a valid aligned block inside the day', () => {
    expect(validateBlockInput({ startMin: 600, endMin: 615 }, [])).toEqual([])
    expect(validateBlockInput({ startMin: 360, endMin: 1440 }, [])).toEqual([])
  })

  it('rejects an end that is not after the start', () => {
    expect(codes(validateBlockInput({ startMin: 600, endMin: 600 }, []))).toContain('END_NOT_AFTER_START')
    expect(codes(validateBlockInput({ startMin: 615, endMin: 600 }, []))).toContain('END_NOT_AFTER_START')
  })

  it('rejects blocks outside 06:00–24:00', () => {
    expect(codes(validateBlockInput({ startMin: 345, endMin: 375 }, []))).toContain('OUT_OF_DAY_RANGE')
    expect(codes(validateBlockInput({ startMin: 1425, endMin: 1455 }, []))).toContain('OUT_OF_DAY_RANGE')
  })

  it('rejects times not aligned to the block unit', () => {
    expect(codes(validateBlockInput({ startMin: 605, endMin: 620 }, []))).toContain('NOT_ALIGNED_TO_UNIT')
    expect(codes(validateBlockInput({ startMin: 600, endMin: 610 }, []))).toContain('NOT_ALIGNED_TO_UNIT')
  })

  it('reports the overlapping block', () => {
    const errors = validateBlockInput({ startMin: 600, endMin: 645 }, [block('gym', 630, 660)])
    expect(errors).toEqual([{ code: 'OVERLAP', conflict: expect.objectContaining({ id: 'gym' }) }])
  })

  it('allows touching blocks, ignores the edited block and deleted blocks', () => {
    expect(validateBlockInput({ startMin: 600, endMin: 630 }, [block('next', 630, 660)])).toEqual([])
    expect(validateBlockInput({ startMin: 600, endMin: 645 }, [block('self', 600, 630)], 'self')).toEqual([])
    expect(validateBlockInput({ startMin: 600, endMin: 645 }, [block('gone', 600, 630, 1)])).toEqual([])
  })
})
```

`packages/core/src/blockStatus.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { nextQuickStatus } from './blockStatus'

describe('nextQuickStatus', () => {
  it.each([
    ['planned', 'done'],
    ['done', 'planned'],
    ['partial', 'done'],
    ['skipped', 'done'],
  ] as const)('%s → %s', (from, to) => {
    expect(nextQuickStatus(from)).toBe(to)
  })
})
```

Run: `npm exec -w @pomobox/core -- vitest run src/blockRules.test.ts src/blockStatus.test.ts`
Expected: FAIL — 모듈 없음

- [ ] **Step 2: 구현**

`packages/core/src/blockRules.ts`:

```ts
import { BLOCK_UNIT_MIN, DAY_END_MIN, DAY_START_MIN } from './config'
import { findConflict } from './time'
import type { Block, TimeRange } from './types'

export type BlockRuleError =
  | { code: 'END_NOT_AFTER_START' }
  | { code: 'OUT_OF_DAY_RANGE' }
  | { code: 'NOT_ALIGNED_TO_UNIT' }
  | { code: 'OVERLAP'; conflict: Block }

export function validateBlockInput(
  input: TimeRange,
  existing: readonly Block[],
  ignoreId?: string,
): BlockRuleError[] {
  const errors: BlockRuleError[] = []
  if (input.endMin <= input.startMin) errors.push({ code: 'END_NOT_AFTER_START' })
  if (input.startMin < DAY_START_MIN || input.endMin > DAY_END_MIN) errors.push({ code: 'OUT_OF_DAY_RANGE' })
  if (input.startMin % BLOCK_UNIT_MIN !== 0 || input.endMin % BLOCK_UNIT_MIN !== 0) {
    errors.push({ code: 'NOT_ALIGNED_TO_UNIT' })
  }
  const conflict = findConflict(existing, input, ignoreId)
  if (conflict) errors.push({ code: 'OVERLAP', conflict })
  return errors
}
```

`packages/core/src/blockStatus.ts`:

```ts
import type { BlockStatus } from './types'

/** 블록의 동그라미를 탭했을 때의 다음 상태. 부분·건너뜀은 완료로 올린다. */
export function nextQuickStatus(status: BlockStatus): BlockStatus {
  return status === 'done' ? 'planned' : 'done'
}
```

`index.ts`에 추가:

```ts
export { validateBlockInput } from './blockRules'
export type { BlockRuleError } from './blockRules'
export { nextQuickStatus } from './blockStatus'
```

- [ ] **Step 3: 통과·검사·Commit**

```bash
cd /Users/jun2/develop/pomobox
npm exec -w @pomobox/core -- vitest run src/blockRules.test.ts src/blockStatus.test.ts
npm run check; echo "exit=$?"
git add packages/core
git commit -m "feat: core에 블록 검증 규칙과 빠른 상태 토글 추가"
```

Expected: PASS (blockRules 6, blockStatus 4), `exit=0`.

---

### Task 5: 오늘 화면 (타임라인·날짜 헤더·현재 시간선·상태 토글)

**Files:**
- Create: `apps/mobile/src/theme.ts`, `apps/mobile/src/stores/uiStore.ts`, `apps/mobile/src/stores/__tests__/uiStore.test.ts`, `apps/mobile/src/features/timeline/useNow.ts`, `apps/mobile/src/features/timeline/useDayBlocks.ts`, `apps/mobile/src/features/timeline/useCategories.ts`, `apps/mobile/src/features/timeline/layout.ts`, `apps/mobile/src/features/timeline/__tests__/layout.test.ts`, `apps/mobile/src/features/timeline/BlockView.tsx`, `apps/mobile/src/features/timeline/__tests__/BlockView.test.tsx`, `apps/mobile/src/features/timeline/NowIndicator.tsx`, `apps/mobile/src/features/timeline/Timeline.tsx`, `apps/mobile/src/features/timeline/DateHeader.tsx`, `apps/mobile/src/components/CenteredMessage.tsx`
- Modify: `apps/mobile/src/app/_layout.tsx`, `apps/mobile/src/app/index.tsx`, `apps/mobile/package.json`

**Interfaces:**
- Consumes: core 전부(`time.ts` 구현 완료), Task 2 `db`·`migrations`, Task 3 저장소·`expoSubscribe`·`RepositoryProvider`
- Produces: `useUiStore`(아래 상태), `PX_PER_MIN`, `tapToStartMin(y)`, `CATEGORY_COLORS`, `useDayBlocks(date)`, `useCategories()`, `Timeline` props `{ date, blocks, categories, isToday, now, onPressEmpty(startMin), onPressBlock(block), onToggleStatus(block) }`.

- [ ] **Step 1: 의존성**

```bash
cd /Users/jun2/develop/pomobox
npm install -w @pomobox/mobile zustand
npm install -D -w @pomobox/mobile @testing-library/react-native
```

- [ ] **Step 2: 테마와 레이아웃 계산 (실패 테스트 먼저)**

`apps/mobile/src/theme.ts`:

```ts
export const CATEGORY_COLORS: Record<string, string> = {
  blue: '#3b82f6',
  purple: '#a855f7',
  green: '#22c55e',
  orange: '#f97316',
  gray: '#6b7280',
}

export const DEFAULT_BLOCK_COLOR = '#94a3b8'

export const colors = {
  background: '#ffffff',
  text: '#18181b',
  muted: '#71717a',
  line: '#e4e4e7',
  now: '#e5484d',
  danger: '#dc2626',
  primary: '#2563eb',
}
```

`apps/mobile/src/features/timeline/__tests__/layout.test.ts`:

```ts
import { PX_PER_MIN, tapToStartMin, timelineHeight } from '../layout'

describe('timeline layout', () => {
  it('uses 2.4px per minute', () => {
    expect(PX_PER_MIN).toBe(2.4)
    expect(timelineHeight()).toBeCloseTo((1440 - 360) * 2.4)
  })

  it('maps a tap to the start of its 15-minute slot', () => {
    expect(tapToStartMin(0)).toBe(360)
    expect(tapToStartMin(35)).toBe(360)
    expect(tapToStartMin(36)).toBe(375)
    expect(tapToStartMin(4 * 144 + 10)).toBe(600)
  })

  it('clamps taps at the bottom so a 15-minute block still fits', () => {
    expect(tapToStartMin(timelineHeight())).toBe(1425)
    expect(tapToStartMin(timelineHeight() + 100)).toBe(1425)
    expect(tapToStartMin(-10)).toBe(360)
  })
})
```

`apps/mobile/src/features/timeline/layout.ts`:

```ts
import { BLOCK_UNIT_MIN, DAY_END_MIN, DAY_START_MIN, minToPx, pxToMin, snapMin } from '@pomobox/core'

export const PX_PER_MIN = 2.4

export function timelineHeight(): number {
  return minToPx(DAY_END_MIN - DAY_START_MIN, PX_PER_MIN)
}

export function topOf(min: number): number {
  return minToPx(min - DAY_START_MIN, PX_PER_MIN)
}

/** 타임라인 안의 y 좌표를 그 칸의 시작 분으로. 마지막 칸 뒤는 마지막 칸으로 맞춘다. */
export function tapToStartMin(y: number): number {
  const offset = snapMin(pxToMin(Math.max(0, y), PX_PER_MIN), BLOCK_UNIT_MIN)
  return Math.min(DAY_START_MIN + offset, DAY_END_MIN - BLOCK_UNIT_MIN)
}
```

Run: `cd apps/mobile && npx jest src/features/timeline/__tests__/layout.test.ts` → 구현 전 FAIL, 구현 후 PASS(3 tests).

- [ ] **Step 3: UI 스토어 (실패 테스트 먼저)**

`apps/mobile/src/stores/__tests__/uiStore.test.ts`:

```ts
import { createUiStore } from '../uiStore'

describe('uiStore', () => {
  it('starts on today and follows today', () => {
    const store = createUiStore('2026-11-18')
    expect(store.getState()).toMatchObject({ selectedDate: '2026-11-18', followToday: true, editing: null })
  })

  it('stops following today when moving to another day, and resumes with goToday', () => {
    const store = createUiStore('2026-11-18')
    store.getState().moveDays(1)
    expect(store.getState()).toMatchObject({ selectedDate: '2026-11-19', followToday: false })
    store.getState().goToday('2026-11-18')
    expect(store.getState()).toMatchObject({ selectedDate: '2026-11-18', followToday: true })
  })

  it('moves to the new today after midnight only while following today', () => {
    const following = createUiStore('2026-11-18')
    following.getState().syncToday('2026-11-19')
    expect(following.getState().selectedDate).toBe('2026-11-19')

    const browsing = createUiStore('2026-11-18')
    browsing.getState().moveDays(-3)
    browsing.getState().syncToday('2026-11-19')
    expect(browsing.getState().selectedDate).toBe('2026-11-15')
  })

  it('opens a draft or an existing block, and closes the editor', () => {
    const store = createUiStore('2026-11-18')
    store.getState().openNew(600)
    expect(store.getState().editing).toEqual({ kind: 'new', date: '2026-11-18', startMin: 600 })
    store.getState().openExisting('id-1')
    expect(store.getState().editing).toEqual({ kind: 'existing', blockId: 'id-1' })
    store.getState().closeEditor()
    expect(store.getState().editing).toBeNull()
  })
})
```

`apps/mobile/src/stores/uiStore.ts`:

```ts
import { addDays, todayString } from '@pomobox/core'
import { createStore, useStore } from 'zustand'

export type Editing =
  | { kind: 'new'; date: string; startMin: number }
  | { kind: 'existing'; blockId: string }
  | null

type UiState = {
  selectedDate: string
  followToday: boolean
  editing: Editing
  moveDays: (amount: number) => void
  goToday: (today: string) => void
  syncToday: (today: string) => void
  openNew: (startMin: number) => void
  openExisting: (blockId: string) => void
  closeEditor: () => void
}

export function createUiStore(today: string) {
  return createStore<UiState>((set, get) => ({
    selectedDate: today,
    followToday: true,
    editing: null,
    moveDays: (amount) => set({ selectedDate: addDays(get().selectedDate, amount), followToday: false }),
    goToday: (todayDate) => set({ selectedDate: todayDate, followToday: true }),
    syncToday: (todayDate) => {
      if (get().followToday && get().selectedDate !== todayDate) set({ selectedDate: todayDate })
    },
    openNew: (startMin) => set({ editing: { kind: 'new', date: get().selectedDate, startMin } }),
    openExisting: (blockId) => set({ editing: { kind: 'existing', blockId } }),
    closeEditor: () => set({ editing: null }),
  }))
}

export const uiStore = createUiStore(todayString(new Date()))

export function useUiStore<T>(selector: (state: UiState) => T): T {
  return useStore(uiStore, selector)
}
```

Run: `npx jest src/stores` → 구현 전 FAIL, 구현 후 PASS(4 tests).

- [ ] **Step 4: 훅**

`apps/mobile/src/features/timeline/useNow.ts`:

```ts
import { useEffect, useState } from 'react'

/** 1분마다 갱신되는 현재 시각. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
```

`apps/mobile/src/features/timeline/useDayBlocks.ts`:

```ts
import type { Block } from '@pomobox/core'
import { useEffect, useState } from 'react'
import { useRepositories } from '../../data/RepositoryProvider'

export function useDayBlocks(date: string): Block[] {
  const { blocks } = useRepositories()
  const [list, setList] = useState<Block[]>([])
  useEffect(() => blocks.observeDay(date, setList), [blocks, date])
  return list
}
```

`apps/mobile/src/features/timeline/useCategories.ts`:

```ts
import type { Category } from '@pomobox/core'
import { useEffect, useState } from 'react'
import { useRepositories } from '../../data/RepositoryProvider'

export function useCategories(): Category[] {
  const { categories } = useRepositories()
  const [list, setList] = useState<Category[]>([])
  useEffect(() => categories.observeAll(setList), [categories])
  return list
}
```

- [ ] **Step 5: BlockView (실패 테스트 먼저)**

`apps/mobile/src/features/timeline/__tests__/BlockView.test.tsx`:

```tsx
import type { Block } from '@pomobox/core'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { BlockView } from '../BlockView'

const block: Block = {
  id: 'id-1',
  date: '2026-11-18',
  startMin: 600,
  endMin: 630,
  title: '',
  categoryId: 'cat-work',
  status: 'planned',
  memo: null,
  createdAt: 0,
  updatedAt: 0,
  deletedAt: null,
}

describe('BlockView', () => {
  it('shows a placeholder for an empty title and the time range', () => {
    render(<BlockView block={block} color="#3b82f6" onPress={jest.fn()} onToggleStatus={jest.fn()} />)
    expect(screen.getByText('제목 없음')).toBeTruthy()
    expect(screen.getByText('10:00–10:30')).toBeTruthy()
  })

  it('calls onToggleStatus from the status circle and onPress from the body', () => {
    const onPress = jest.fn()
    const onToggleStatus = jest.fn()
    render(<BlockView block={block} color="#3b82f6" onPress={onPress} onToggleStatus={onToggleStatus} />)
    fireEvent.press(screen.getByLabelText('상태: 계획. 눌러서 완료'))
    expect(onToggleStatus).toHaveBeenCalledWith(block)
    expect(onPress).not.toHaveBeenCalled()
    fireEvent.press(screen.getByText('제목 없음'))
    expect(onPress).toHaveBeenCalledWith(block)
  })
})
```

`apps/mobile/src/features/timeline/BlockView.tsx`:

```tsx
import type { Block, BlockStatus } from '@pomobox/core'
import { formatMin, nextQuickStatus } from '@pomobox/core'
import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme'
import { PX_PER_MIN, topOf } from './layout'

export const STATUS_LABELS: Record<BlockStatus, string> = {
  planned: '계획',
  done: '완료',
  partial: '부분',
  skipped: '건너뜀',
}

type Props = {
  block: Block
  color: string
  onPress: (block: Block) => void
  onToggleStatus: (block: Block) => void
}

function StatusCircle({ status, color }: { status: BlockStatus; color: string }) {
  return (
    <View style={[styles.circle, { borderColor: color }]}>
      {status === 'done' && <View style={[styles.fill, { backgroundColor: color }]} />}
      {status === 'partial' && <View style={[styles.halfFill, { backgroundColor: color }]} />}
    </View>
  )
}

export const BlockView = memo(function BlockView({ block, color, onPress, onToggleStatus }: Props) {
  const skipped = block.status === 'skipped'
  const next = STATUS_LABELS[nextQuickStatus(block.status)]
  return (
    <View
      style={[
        styles.container,
        { top: topOf(block.startMin), height: (block.endMin - block.startMin) * PX_PER_MIN, borderLeftColor: color },
        skipped && styles.skipped,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`상태: ${STATUS_LABELS[block.status]}. 눌러서 ${next}`}
        hitSlop={8}
        onPress={() => onToggleStatus(block)}
        style={styles.circleHit}
      >
        <StatusCircle status={block.status} color={color} />
      </Pressable>
      <Pressable style={styles.body} onPress={() => onPress(block)}>
        <Text numberOfLines={1} style={[styles.title, skipped && styles.strike]}>
          {block.title || '제목 없음'}
        </Text>
        <Text style={styles.time}>
          {formatMin(block.startMin)}–{formatMin(block.endMin)}
        </Text>
      </Pressable>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 56,
    right: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f4f4f5',
    borderLeftWidth: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  skipped: { opacity: 0.45 },
  circleHit: { paddingTop: 2, paddingRight: 8 },
  circle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, overflow: 'hidden' },
  fill: { flex: 1 },
  halfFill: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%' },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: colors.text },
  strike: { textDecorationLine: 'line-through' },
  time: { fontSize: 11, color: colors.muted },
})
```

Run: `npx jest src/features/timeline/__tests__/BlockView.test.tsx` → 구현 전 FAIL, 구현 후 PASS(2 tests).

- [ ] **Step 6: NowIndicator, Timeline, DateHeader, CenteredMessage**

`apps/mobile/src/features/timeline/NowIndicator.tsx`:

```tsx
import { DAY_END_MIN, DAY_START_MIN } from '@pomobox/core'
import { StyleSheet, View } from 'react-native'
import { colors } from '../../theme'
import { topOf } from './layout'

export function NowIndicator({ now }: { now: Date }) {
  const min = now.getHours() * 60 + now.getMinutes()
  if (min < DAY_START_MIN || min >= DAY_END_MIN) return null
  return <View pointerEvents="none" style={[styles.line, { top: topOf(min) }]} />
}

const styles = StyleSheet.create({
  line: { position: 'absolute', left: 48, right: 0, height: 2, backgroundColor: colors.now },
})
```

`apps/mobile/src/features/timeline/Timeline.tsx`:

```tsx
import type { Block, Category } from '@pomobox/core'
import { DAY_END_MIN, DAY_START_MIN, formatMin } from '@pomobox/core'
import { useEffect, useRef } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { CATEGORY_COLORS, DEFAULT_BLOCK_COLOR, colors } from '../../theme'
import { BlockView } from './BlockView'
import { NowIndicator } from './NowIndicator'
import { tapToStartMin, timelineHeight, topOf } from './layout'

type Props = {
  date: string
  blocks: Block[]
  categories: Category[]
  isToday: boolean
  now: Date
  onPressEmpty: (startMin: number) => void
  onPressBlock: (block: Block) => void
  onToggleStatus: (block: Block) => void
}

const HOURS = Array.from({ length: (DAY_END_MIN - DAY_START_MIN) / 60 + 1 }, (_, i) => DAY_START_MIN + i * 60)

export function Timeline({ date, blocks, categories, isToday, now, onPressEmpty, onPressBlock, onToggleStatus }: Props) {
  const scrollRef = useRef<ScrollView>(null)
  const { height: windowHeight } = useWindowDimensions()
  const colorOf = (block: Block) => {
    const key = categories.find((c) => c.id === block.categoryId)?.color
    return (key && CATEGORY_COLORS[key]) || DEFAULT_BLOCK_COLOR
  }

  // 날짜가 바뀔 때만 진입 위치로 스크롤한다(블록 변경마다 튀지 않게).
  useEffect(() => {
    const nowMin = now.getHours() * 60 + now.getMinutes()
    const targetMin = isToday ? nowMin : (blocks[0]?.startMin ?? DAY_START_MIN)
    const offset = isToday ? windowHeight / 3 : 16
    scrollRef.current?.scrollTo({ y: Math.max(0, topOf(targetMin) - offset), animated: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  return (
    <ScrollView ref={scrollRef} style={styles.scroll}>
      <Pressable
        accessibilityLabel="빈 칸을 눌러 블록 추가"
        style={{ height: timelineHeight() }}
        onPress={(event) => onPressEmpty(tapToStartMin(event.nativeEvent.locationY))}
      >
        {HOURS.map((min) => (
          <View key={min} pointerEvents="none" style={[styles.hourRow, { top: topOf(min) }]}>
            <Text style={styles.hourLabel}>{formatMin(min)}</Text>
            <View style={styles.hourLine} />
          </View>
        ))}
      </Pressable>
      {blocks.map((block) => (
        <BlockView
          key={block.id}
          block={block}
          color={colorOf(block)}
          onPress={onPressBlock}
          onToggleStatus={onToggleStatus}
        />
      ))}
      {isToday && <NowIndicator now={now} />}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  hourRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', height: 14, marginTop: -7 },
  hourLabel: { width: 48, textAlign: 'right', paddingRight: 6, fontSize: 11, color: colors.muted },
  hourLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
})
```

`apps/mobile/src/features/timeline/DateHeader.tsx`:

```tsx
import { formatDateLabel } from '@pomobox/core'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme'

type Props = {
  date: string
  isToday: boolean
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function DateHeader({ date, isToday, onPrev, onNext, onToday }: Props) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityLabel="이전 날" hitSlop={12} onPress={onPrev}>
        <Text style={styles.arrow}>‹</Text>
      </Pressable>
      <Text style={styles.label}>{formatDateLabel(date)}</Text>
      <Pressable accessibilityLabel="다음 날" hitSlop={12} onPress={onNext}>
        <Text style={styles.arrow}>›</Text>
      </Pressable>
      <View style={styles.spacer} />
      {!isToday && (
        <Pressable accessibilityRole="button" onPress={onToday} style={styles.todayButton}>
          <Text style={styles.todayText}>오늘</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
  arrow: { fontSize: 28, color: colors.text, lineHeight: 30 },
  label: { fontSize: 18, fontWeight: '700', color: colors.text },
  spacer: { flex: 1 },
  todayButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.line },
  todayText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
})
```

`apps/mobile/src/components/CenteredMessage.tsx`:

```tsx
import { StyleSheet, Text, View } from 'react-native'

export function CenteredMessage({ text }: { text: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: 15, textAlign: 'center' },
})
```

- [ ] **Step 7: 루트 레이아웃 (마이그레이션·저장소)**

`apps/mobile/src/app/_layout.tsx`:

```tsx
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { randomUUID } from 'expo-crypto'
import { Stack } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { CenteredMessage } from '../components/CenteredMessage'
import { RepositoryProvider, type Repositories } from '../data/RepositoryProvider'
import { createBlockRepository } from '../data/blockRepository'
import { createCategoryRepository, seedDefaultCategories } from '../data/categoryRepository'
import { expoSubscribe } from '../data/expoSubscribe'
import { db } from '../db/client'
import migrations from '../db/migrations/migrations'

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations)
  const [seeded, setSeeded] = useState(false)
  const repositories = useMemo<Repositories>(
    () => ({
      blocks: createBlockRepository({ db, subscribe: expoSubscribe, newId: randomUUID }),
      categories: createCategoryRepository({ db, subscribe: expoSubscribe }),
    }),
    [],
  )

  useEffect(() => {
    if (!success) return
    seedDefaultCategories(db)
    setSeeded(true)
  }, [success])

  if (error) return <CenteredMessage text={`데이터를 준비하지 못했어요.\n${error.message}`} />
  if (!success || !seeded) return <CenteredMessage text="불러오는 중…" />

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <RepositoryProvider value={repositories}>
          <Stack screenOptions={{ headerShown: false }} />
        </RepositoryProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}
```

`@gorhom/bottom-sheet`는 Task 6에서 설치한다. 이 Task에서는 `BottomSheetModalProvider` import와 감싸기를 **빼고** 작성하고, Task 6에서 추가한다.

- [ ] **Step 8: 오늘 화면**

`apps/mobile/src/app/index.tsx`:

```tsx
import type { Block } from '@pomobox/core'
import { nextQuickStatus, todayString } from '@pomobox/core'
import { useCallback, useEffect } from 'react'
import { Alert, AppState, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRepositories } from '../data/RepositoryProvider'
import { DateHeader } from '../features/timeline/DateHeader'
import { Timeline } from '../features/timeline/Timeline'
import { useCategories } from '../features/timeline/useCategories'
import { useDayBlocks } from '../features/timeline/useDayBlocks'
import { useNow } from '../features/timeline/useNow'
import { uiStore, useUiStore } from '../stores/uiStore'
import { colors } from '../theme'

export default function TodayScreen() {
  const { blocks: blockRepository } = useRepositories()
  const selectedDate = useUiStore((s) => s.selectedDate)
  const now = useNow()
  const today = todayString(now)
  const blocks = useDayBlocks(selectedDate)
  const categories = useCategories()

  // 자정을 넘기거나 앱이 다시 열릴 때 "오늘"을 따라간다.
  useEffect(() => {
    uiStore.getState().syncToday(today)
  }, [today])
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') uiStore.getState().syncToday(todayString(new Date()))
    })
    return () => subscription.remove()
  }, [])

  const onToggleStatus = useCallback(
    (block: Block) => {
      blockRepository.update(block.id, { status: nextQuickStatus(block.status) }).catch(() => {
        Alert.alert('저장하지 못했어요')
      })
    },
    [blockRepository],
  )

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <DateHeader
        date={selectedDate}
        isToday={selectedDate === today}
        onPrev={() => uiStore.getState().moveDays(-1)}
        onNext={() => uiStore.getState().moveDays(1)}
        onToday={() => uiStore.getState().goToday(today)}
      />
      <Timeline
        date={selectedDate}
        blocks={blocks}
        categories={categories}
        isToday={selectedDate === today}
        now={now}
        onPressEmpty={(startMin) => uiStore.getState().openNew(startMin)}
        onPressBlock={(block) => uiStore.getState().openExisting(block.id)}
        onToggleStatus={onToggleStatus}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
})
```

- [ ] **Step 9: 검사·번들·Commit**

```bash
cd /Users/jun2/develop/pomobox
npm run check; echo "exit=$?"
cd apps/mobile && npx expo export --platform android --output-dir /private/tmp/claude-501/-Users-jun2-develop-pomobox/d4a8f4c6-0de9-4d79-943e-c3880fc4370c/scratchpad/a1-export && cd ../..
git add apps/mobile package-lock.json
git commit -m "feat: 오늘 화면에 타임라인·날짜 이동·현재 시간선·빠른 완료 체크 추가"
```

Expected: `exit=0`, 번들 성공.

---

### Task 6: 블록 편집 시트와 폼

**Files:**
- Create: `apps/mobile/src/features/blocks/draft.ts`, `apps/mobile/src/features/blocks/__tests__/draft.test.ts`, `apps/mobile/src/features/blocks/BlockEditorForm.tsx`, `apps/mobile/src/features/blocks/__tests__/BlockEditorForm.test.tsx`, `apps/mobile/src/features/blocks/BlockEditorSheet.tsx`
- Modify: `apps/mobile/src/app/_layout.tsx`(BottomSheetModalProvider), `apps/mobile/src/app/index.tsx`(시트 연결), `apps/mobile/package.json`

**Interfaces:**
- Consumes: Task 4 `validateBlockInput`, Task 5 스토어·훅·`STATUS_LABELS`·`CATEGORY_COLORS`
- Produces: `Draft` 타입, `draftFromNew(startMin)`, `draftFromBlock(block)`, `shiftStart(draft, delta)`, `setDuration(draft, min)`, `canShift(draft, delta)`, `canSetDuration(draft, min)`, `ruleErrorMessage(error)`, `DURATION_CHIPS`; `BlockEditorForm` props `{ draft, categories, dayBlocks, ignoreId, isExisting, onChange, onSave, onDelete }`; `BlockEditorSheet`.

- [ ] **Step 1: 바텀시트 설치**

```bash
cd /Users/jun2/develop/pomobox/apps/mobile
npx expo install @gorhom/bottom-sheet
cd ../.. && npm ls react react-native-reanimated react-native-gesture-handler
```

설치된 버전이 SDK 58의 reanimated/gesture-handler와 맞지 않아 번들·테스트가 실패하면 **RN `Modal` 기반 시트**로 대체한다(`BlockEditorSheet`만 바뀌고 폼은 그대로). 이 경우 보고서에 원인을 적는다.

- [ ] **Step 2: 임시 값 계산 (실패 테스트 먼저)**

`apps/mobile/src/features/blocks/__tests__/draft.test.ts`:

```ts
import { canSetDuration, canShift, draftFromNew, ruleErrorMessage, setDuration, shiftStart } from '../draft'

describe('draft', () => {
  it('creates a 15-minute planned draft', () => {
    expect(draftFromNew(600)).toEqual({ startMin: 600, endMin: 615, title: '', categoryId: null, status: 'planned' })
  })

  it('shifts start and end together by 15 minutes', () => {
    expect(shiftStart(draftFromNew(600), 15)).toMatchObject({ startMin: 615, endMin: 630 })
    expect(shiftStart(draftFromNew(600), -15)).toMatchObject({ startMin: 585, endMin: 600 })
  })

  it('blocks shifting past the day range', () => {
    expect(canShift(draftFromNew(360), -15)).toBe(false)
    expect(canShift(draftFromNew(1425), 15)).toBe(false)
    expect(canShift(draftFromNew(600), 15)).toBe(true)
  })

  it('sets duration from the start and blocks durations past 24:00', () => {
    expect(setDuration(draftFromNew(600), 60)).toMatchObject({ startMin: 600, endMin: 660 })
    expect(canSetDuration(draftFromNew(1395), 45)).toBe(true)
    expect(canSetDuration(draftFromNew(1395), 60)).toBe(false)
  })

  it('formats rule errors in Korean', () => {
    const conflict = {
      id: 'gym', date: '2026-11-18', startMin: 600, endMin: 630, title: '헬스장', categoryId: null,
      status: 'planned' as const, memo: null, createdAt: 0, updatedAt: 0, deletedAt: null,
    }
    expect(ruleErrorMessage({ code: 'OVERLAP', conflict })).toBe("10:00–10:30 '헬스장'과 겹쳐요")
    expect(ruleErrorMessage({ code: 'OVERLAP', conflict: { ...conflict, title: '' } })).toBe("10:00–10:30 '제목 없음'과 겹쳐요")
    expect(ruleErrorMessage({ code: 'OUT_OF_DAY_RANGE' })).toBe('06:00~24:00 안에서만 만들 수 있어요')
    expect(ruleErrorMessage({ code: 'END_NOT_AFTER_START' })).toBe('끝 시각이 시작 시각보다 늦어야 해요')
    expect(ruleErrorMessage({ code: 'NOT_ALIGNED_TO_UNIT' })).toBe('15분 단위로만 정할 수 있어요')
  })
})
```

`apps/mobile/src/features/blocks/draft.ts`:

```ts
import type { Block, BlockRuleError, BlockStatus } from '@pomobox/core'
import { BLOCK_UNIT_MIN, DAY_END_MIN, DAY_START_MIN, formatMin } from '@pomobox/core'

export const DURATION_CHIPS = [15, 30, 45, 60, 90] as const

export type Draft = {
  startMin: number
  endMin: number
  title: string
  categoryId: string | null
  status: BlockStatus
}

export function draftFromNew(startMin: number): Draft {
  return { startMin, endMin: startMin + BLOCK_UNIT_MIN, title: '', categoryId: null, status: 'planned' }
}

export function draftFromBlock(block: Block): Draft {
  const { startMin, endMin, title, categoryId, status } = block
  return { startMin, endMin, title, categoryId, status }
}

export function canShift(draft: Draft, delta: number): boolean {
  return draft.startMin + delta >= DAY_START_MIN && draft.endMin + delta <= DAY_END_MIN
}

export function shiftStart(draft: Draft, delta: number): Draft {
  return { ...draft, startMin: draft.startMin + delta, endMin: draft.endMin + delta }
}

export function canSetDuration(draft: Draft, minutes: number): boolean {
  return draft.startMin + minutes <= DAY_END_MIN
}

export function setDuration(draft: Draft, minutes: number): Draft {
  return { ...draft, endMin: draft.startMin + minutes }
}

export function ruleErrorMessage(error: BlockRuleError): string {
  switch (error.code) {
    case 'OVERLAP': {
      const { startMin, endMin, title } = error.conflict
      return `${formatMin(startMin)}–${formatMin(endMin)} '${title || '제목 없음'}'과 겹쳐요`
    }
    case 'OUT_OF_DAY_RANGE':
      return '06:00~24:00 안에서만 만들 수 있어요'
    case 'END_NOT_AFTER_START':
      return '끝 시각이 시작 시각보다 늦어야 해요'
    case 'NOT_ALIGNED_TO_UNIT':
      return '15분 단위로만 정할 수 있어요'
  }
}
```

Run: `cd apps/mobile && npx jest src/features/blocks/__tests__/draft.test.ts` → 구현 전 FAIL, 구현 후 PASS(5 tests).

- [ ] **Step 3: 편집 폼 (실패 테스트 먼저)**

`apps/mobile/src/features/blocks/__tests__/BlockEditorForm.test.tsx`:

```tsx
import type { Block, Category } from '@pomobox/core'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { useState } from 'react'
import { BlockEditorForm } from '../BlockEditorForm'
import { draftFromNew, type Draft } from '../draft'

const categories: Category[] = [
  { id: 'cat-work', name: '업무', color: 'blue', sortOrder: 0, createdAt: 0, updatedAt: 0, deletedAt: null },
]

const gym: Block = {
  id: 'gym', date: '2026-11-18', startMin: 630, endMin: 660, title: '헬스장', categoryId: null,
  status: 'planned', memo: null, createdAt: 0, updatedAt: 0, deletedAt: null,
}

function Harness({ initial, dayBlocks = [], ignoreId, onSave = jest.fn() }: {
  initial: Draft; dayBlocks?: Block[]; ignoreId?: string; onSave?: (d: Draft) => void
}) {
  const [draft, setDraft] = useState(initial)
  return (
    <BlockEditorForm
      draft={draft}
      categories={categories}
      dayBlocks={dayBlocks}
      ignoreId={ignoreId}
      isExisting={Boolean(ignoreId)}
      onChange={setDraft}
      onSave={onSave}
      onDelete={jest.fn()}
    />
  )
}

describe('BlockEditorForm', () => {
  it('shows the overlap message and disables save', () => {
    const onSave = jest.fn()
    render(<Harness initial={draftFromNew(615)} dayBlocks={[gym]} onSave={onSave} />)
    fireEvent.press(screen.getByLabelText('길이 30분'))
    expect(screen.getByText("10:30–11:00 '헬스장'과 겹쳐요")).toBeTruthy()
    fireEvent.press(screen.getByText('저장'))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('does not report the edited block as its own conflict', () => {
    render(<Harness initial={{ ...draftFromNew(630), endMin: 660 }} dayBlocks={[gym]} ignoreId="gym" />)
    expect(screen.queryByText(/겹쳐요/)).toBeNull()
  })

  it('updates the end time when a duration chip is pressed', () => {
    render(<Harness initial={draftFromNew(600)} />)
    fireEvent.press(screen.getByLabelText('길이 60분'))
    expect(screen.getByText('10:00–11:00')).toBeTruthy()
  })

  it('disables shifting before 06:00 and durations past 24:00', () => {
    render(<Harness initial={draftFromNew(360)} />)
    expect(screen.getByLabelText('15분 앞으로').props.accessibilityState).toMatchObject({ disabled: true })

    render(<Harness initial={draftFromNew(1395)} />)
    expect(screen.getAllByLabelText('길이 60분').at(-1)?.props.accessibilityState).toMatchObject({ disabled: true })
  })

  it('saves the current draft', () => {
    const onSave = jest.fn()
    render(<Harness initial={draftFromNew(600)} onSave={onSave} />)
    fireEvent.changeText(screen.getByPlaceholderText('무엇을 할까요?'), '기획서')
    fireEvent.press(screen.getByLabelText('카테고리 업무'))
    fireEvent.press(screen.getByText('저장'))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: '기획서', categoryId: 'cat-work', startMin: 600 }))
  })
})
```

`apps/mobile/src/features/blocks/BlockEditorForm.tsx`:

```tsx
import type { Block, BlockStatus, Category } from '@pomobox/core'
import { BLOCK_STATUSES, BLOCK_UNIT_MIN, formatMin, validateBlockInput } from '@pomobox/core'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { CATEGORY_COLORS, DEFAULT_BLOCK_COLOR, colors } from '../../theme'
import { STATUS_LABELS } from '../timeline/BlockView'
import {
  DURATION_CHIPS,
  canSetDuration,
  canShift,
  ruleErrorMessage,
  setDuration,
  shiftStart,
  type Draft,
} from './draft'

type Props = {
  draft: Draft
  categories: Category[]
  dayBlocks: Block[]
  ignoreId?: string
  isExisting: boolean
  onChange: (draft: Draft) => void
  onSave: (draft: Draft) => void
  onDelete: () => void
}

function Chip({ label, accessibilityLabel, selected, disabled, color, onPress }: {
  label: string; accessibilityLabel: string; selected?: boolean; disabled?: boolean; color?: string; onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: Boolean(disabled), selected: Boolean(selected) }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: color ?? colors.primary, borderColor: color ?? colors.primary }, disabled && styles.disabled]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  )
}

export function BlockEditorForm({ draft, categories, dayBlocks, ignoreId, isExisting, onChange, onSave, onDelete }: Props) {
  const errors = validateBlockInput(draft, dayBlocks, ignoreId)
  const duration = draft.endMin - draft.startMin

  return (
    <View style={styles.form}>
      <TextInput
        placeholder="무엇을 할까요?"
        value={draft.title}
        onChangeText={(title) => onChange({ ...draft, title })}
        style={styles.titleInput}
      />

      <View style={styles.row}>
        <Chip
          label="−15"
          accessibilityLabel="15분 앞으로"
          disabled={!canShift(draft, -BLOCK_UNIT_MIN)}
          onPress={() => onChange(shiftStart(draft, -BLOCK_UNIT_MIN))}
        />
        <Text style={styles.timeText}>
          {formatMin(draft.startMin)}–{formatMin(draft.endMin)}
        </Text>
        <Chip
          label="+15"
          accessibilityLabel="15분 뒤로"
          disabled={!canShift(draft, BLOCK_UNIT_MIN)}
          onPress={() => onChange(shiftStart(draft, BLOCK_UNIT_MIN))}
        />
      </View>

      <View style={styles.wrap}>
        {DURATION_CHIPS.map((minutes) => (
          <Chip
            key={minutes}
            label={`${minutes}분`}
            accessibilityLabel={`길이 ${minutes}분`}
            selected={duration === minutes}
            disabled={!canSetDuration(draft, minutes)}
            onPress={() => onChange(setDuration(draft, minutes))}
          />
        ))}
      </View>

      <View style={styles.wrap}>
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            accessibilityLabel={`카테고리 ${category.name}`}
            selected={draft.categoryId === category.id}
            color={CATEGORY_COLORS[category.color] ?? DEFAULT_BLOCK_COLOR}
            onPress={() => onChange({ ...draft, categoryId: draft.categoryId === category.id ? null : category.id })}
          />
        ))}
      </View>

      <View style={styles.wrap}>
        {BLOCK_STATUSES.map((status: BlockStatus) => (
          <Chip
            key={status}
            label={STATUS_LABELS[status]}
            accessibilityLabel={`상태 ${STATUS_LABELS[status]}`}
            selected={draft.status === status}
            onPress={() => onChange({ ...draft, status })}
          />
        ))}
      </View>

      {errors.map((error) => (
        <Text key={error.code} style={styles.error}>
          {ruleErrorMessage(error)}
        </Text>
      ))}

      <View style={styles.row}>
        {isExisting && (
          <Pressable accessibilityRole="button" onPress={onDelete} style={styles.deleteButton}>
            <Text style={styles.deleteText}>삭제</Text>
          </Pressable>
        )}
        <View style={styles.spacer} />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: errors.length > 0 }}
          disabled={errors.length > 0}
          onPress={() => onSave(draft)}
          style={[styles.saveButton, errors.length > 0 && styles.disabled]}
        >
          <Text style={styles.saveText}>저장</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  form: { gap: 14, padding: 16 },
  titleInput: { fontSize: 18, borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeText: { fontSize: 16, fontWeight: '600', minWidth: 110, textAlign: 'center' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1, borderColor: colors.line },
  chipText: { fontSize: 13, color: colors.text },
  chipTextSelected: { color: '#ffffff', fontWeight: '600' },
  disabled: { opacity: 0.35 },
  error: { color: colors.danger, fontSize: 13 },
  spacer: { flex: 1 },
  deleteButton: { paddingHorizontal: 12, paddingVertical: 10 },
  deleteText: { color: colors.danger, fontSize: 15 },
  saveButton: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
})
```

Run: `npx jest src/features/blocks/__tests__/BlockEditorForm.test.tsx` → 구현 전 FAIL, 구현 후 PASS(5 tests).

- [ ] **Step 4: 시트 (저장 전에는 기록하지 않음)**

`apps/mobile/src/features/blocks/BlockEditorSheet.tsx`:

```tsx
import type { Block, Category } from '@pomobox/core'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'
import { useRepositories } from '../../data/RepositoryProvider'
import type { Editing } from '../../stores/uiStore'
import { BlockEditorForm } from './BlockEditorForm'
import { draftFromBlock, draftFromNew, type Draft } from './draft'

type Props = {
  editing: Editing
  date: string
  dayBlocks: Block[]
  categories: Category[]
  onClose: () => void
}

export function BlockEditorSheet({ editing, date, dayBlocks, categories, onClose }: Props) {
  const { blocks } = useRepositories()
  const sheetRef = useRef<BottomSheetModal>(null)
  const existing = editing?.kind === 'existing' ? dayBlocks.find((b) => b.id === editing.blockId) : undefined
  const [draft, setDraft] = useState<Draft | null>(null)

  useEffect(() => {
    if (editing?.kind === 'new') setDraft(draftFromNew(editing.startMin))
    else if (existing) setDraft(draftFromBlock(existing))
    else setDraft(null)
    if (editing) sheetRef.current?.present()
    else sheetRef.current?.dismiss()
    // 편집 대상이 바뀔 때만 초기화한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const save = async (value: Draft) => {
    try {
      if (existing) await blocks.update(existing.id, value)
      else await blocks.create({ date, ...value })
      onClose()
    } catch {
      Alert.alert('저장하지 못했어요')
    }
  }

  const confirmDelete = () => {
    if (!existing) return
    Alert.alert('블록을 삭제할까요?', undefined, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          blocks.remove(existing.id).then(onClose, () => Alert.alert('삭제하지 못했어요'))
        },
      },
    ])
  }

  return (
    <BottomSheetModal ref={sheetRef} onDismiss={onClose} enableDynamicSizing>
      <BottomSheetView>
        {draft && (
          <BlockEditorForm
            draft={draft}
            categories={categories}
            dayBlocks={dayBlocks}
            ignoreId={existing?.id}
            isExisting={Boolean(existing)}
            onChange={setDraft}
            onSave={save}
            onDelete={confirmDelete}
          />
        )}
      </BottomSheetView>
    </BottomSheetModal>
  )
}
```

`TextInput`은 시트 안에서 키보드 처리를 위해 `@gorhom/bottom-sheet`의 `BottomSheetTextInput`으로 바꿔도 된다(폼 테스트의 placeholder 기반 조회는 유지).

- [ ] **Step 5: 연결**

`_layout.tsx`에 `BottomSheetModalProvider` import와 감싸기를 Task 5 Step 7의 원래 형태대로 추가한다.

`index.tsx`의 `</SafeAreaView>` 바로 앞에 추가:

```tsx
      <BlockEditorSheet
        editing={editing}
        date={editing?.kind === 'new' ? editing.date : selectedDate}
        dayBlocks={blocks}
        categories={categories}
        onClose={() => uiStore.getState().closeEditor()}
      />
```

그리고 상단에 `import { BlockEditorSheet } from '../features/blocks/BlockEditorSheet'`, 컴포넌트 안에 `const editing = useUiStore((s) => s.editing)`을 추가한다.

- [ ] **Step 6: 검사·번들·Commit**

```bash
cd /Users/jun2/develop/pomobox
npm run check; echo "exit=$?"
cd apps/mobile && npx expo export --platform android --output-dir /private/tmp/claude-501/-Users-jun2-develop-pomobox/d4a8f4c6-0de9-4d79-943e-c3880fc4370c/scratchpad/a1-export && cd ../..
npm ls react
git add apps/mobile package-lock.json
git commit -m "feat: 블록 편집 바텀시트와 검증 폼 추가"
```

---

### Task 7: 문서와 템플릿 정리

**Files:**
- Create: `docs/decisions/0003-local-db-drizzle.md`
- Modify: `docs/guides/commands.md`, `docs/guides/conventions.md`, `docs/PLAN.md`, `apps/mobile/package.json`, `apps/mobile/assets/**`, `package-lock.json`

- [ ] **Step 1: 템플릿 잔여 정리**

`apps/mobile/src`와 `app.json`에서 쓰지 않는 의존성을 확인하고 제거한다(`grep -rn "<패키지>" apps/mobile/src apps/mobile/app.json`이 비어 있을 때만):

```bash
cd /Users/jun2/develop/pomobox
for p in @expo/ui expo-glass-effect expo-symbols expo-device expo-image expo-web-browser; do
  echo "== $p"; grep -rn "$p" apps/mobile/src apps/mobile/app.json || echo "unused"
done
```

`unused`인 것만 `npm uninstall -w @pomobox/mobile <패키지>`. `app.json`이 참조하지 않는 `assets/images/*`(예: `tabIcons/`, `react-logo*`, `expo-badge*`, `logo-glow.png`, `tutorial-web.png`)를 지운다. `assets/expo.icon/`(iOS 아이콘 번들)과 `app.json`이 가리키는 파일은 남긴다.

- [ ] **Step 2: ADR-0003**

`docs/decisions/0003-local-db-drizzle.md`:

```markdown
# ADR-0003: 앱 로컬 DB — expo-sqlite + Drizzle ORM

- 상태: 채택
- 날짜: 2026-11-18

## 맥락

A1-1에서 앱의 블록·카테고리를 기기 안에 저장해야 한다. 저장소 인터페이스(`observeDay` 등)는 `@pomobox/core`에 이미 있고, 로그인(L) 단계에서 Firestore 구현으로 바꿔 끼울 수 있어야 한다.

## 선택지

1. **expo-sqlite + 직접 쓴 SQL**: Expo 공식 예제 방식. 추가 설정 없음, `PRAGMA user_version`으로 마이그레이션. 스키마가 커지면 타입·쿼리를 손으로 맞춰야 한다.
2. **expo-sqlite + Drizzle(채택)**: TS 스키마에서 타입 추론, drizzle-kit이 마이그레이션 SQL 생성. 최근 Expo 생태계에서 많이 쓰는 조합.
3. **Drizzle `useLiveQuery`를 화면에서 직접 사용**: 가장 짧지만 화면이 Drizzle에 묶여 저장소 교체가 어렵다.

## 결정

2번. 저장소는 `({ db, subscribe })`를 받아 Drizzle 쿼리로 인터페이스를 구현하고, 변경 감지는 expo-sqlite `addDatabaseChangeListener`를 어댑터로 감싼다.

## 결과

- `.sql` 마이그레이션을 번들에 넣기 위해 `babel-plugin-inline-import`와 Metro `sourceExts`에 `sql`을 추가했다.
- 저장소 테스트는 `better-sqlite3` 메모리 DB에 같은 마이그레이션을 적용해 mock 없이 실제 SQL로 검증한다.
- DB 칼럼은 snake_case, TS 필드는 camelCase(`casing: 'snake_case'`). 스키마 변경은 `npm run db:generate -w @pomobox/mobile`로만 한다.
```

(구현 중 Babel·Metro·better-sqlite3에서 우회한 것이 있으면 "결과"에 한 줄씩 덧붙인다.)

- [ ] **Step 3: 가이드·PLAN**

`docs/guides/commands.md` 표에 추가:

```markdown
| 앱 DB 마이그레이션 생성 (스키마 변경 후) | `npm run db:generate -w @pomobox/mobile` |
```

`docs/guides/conventions.md` "데이터" 절의 마지막 줄 위에 추가:

```markdown
- 앱 DB 스키마는 `apps/mobile/src/db/schema.ts`에서 바꾸고, `npm run db:generate -w @pomobox/mobile`로 마이그레이션을 만들어 함께 커밋한다(ADR-0003).
```

`docs/PLAN.md` 앱 기술 스택 표의 게스트 저장소 행 이유 칸 끝에 ` (ADR-0003)`를 붙이고, 스타일 행을 `RN StyleSheet (A1 결정, NativeWind는 A2 이후 재검토)`로 바꾼다.

- [ ] **Step 4: 검사와 Commit**

```bash
cd /Users/jun2/develop/pomobox
npm run check; echo "exit=$?"
cd apps/mobile && npx expo export --platform android --output-dir /private/tmp/claude-501/-Users-jun2-develop-pomobox/d4a8f4c6-0de9-4d79-943e-c3880fc4370c/scratchpad/a1-export && cd ../..
git add -A docs apps/mobile package-lock.json
git commit -m "docs: ADR-0003 추가와 가이드 갱신, Expo 템플릿 잔여 의존성·에셋 정리"
```

---

## Part B · 직접 하실 작업

- [ ] **B-1. `time.ts` 구현** (Task 1 이후, 위 "직접 작업 B-1" 참고)
- [ ] **B-2. dev 빌드 재설치** — `expo-sqlite`, `expo-crypto`, bottom-sheet(reanimated 사용)로 네이티브 코드가 바뀌었으므로 `npm run android:dev -w @pomobox/mobile`. 흰 화면이면 `adb reverse tcp:8081 tcp:8081`.
- [ ] **B-3. 실기기 확인 (spec 7절)** — 블록 생성·수정·겹침 거부·완료 체크·부분/건너뜀·삭제·날짜 이동·앱 종료 후 재실행 시 데이터 유지.
- [ ] **B-4. 실사용 시작과 A1-1 회고** — 며칠 사용 후 `docs/learnings.md`에 한 단락.

## A1-1 완료 게이트 (spec 7절)

- [ ] 루트 `npm run check` 통과 (Task 1~7)
- [ ] `time.ts` 테스트 통과, 직접 구현 (B-1)
- [ ] 실기기 확인 항목 전부 (B-3)
- [ ] 실사용 시작 (B-4)
- [ ] ADR-0003(Task 7), A1-1 회고(B-4)
