# A1-1 · 앱 MVP (저장소·타임라인·블록 CRUD) 설계

- 작성일: 2026-11-18
- 상위 계획: `docs/PLAN.md` (A1 · 앱 MVP)
- 출발점: `docs/superpowers/specs/2026-11-17-w1-web-mvp-notes.md` (보류한 웹 W1 결정)
- 범위: A1을 둘로 나눈 앞부분. 블록 시작 알림은 A1-2에서 별도 spec으로 다룬다.

## 1. 목표

폰에서 하루를 15분 블록으로 계획하고 완료를 체크하는 최소 기능을 만든다. A1-1이 끝나면 본인이 매일 쓰기 시작할 수 있어야 한다.

## 2. 확정된 결정

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 범위 분할 | A1-1(저장소·타임라인·CRUD·날짜 이동), A1-2(블록 알림) | 알림은 권한·예약·재동기화로 독립된 덩어리 |
| 스타일링 | RN `StyleSheet` | RN 스타일 기본기 학습, 타임라인의 계산된 위치값과 자연스럽게 맞음. NativeWind는 A2 이후 재검토 |
| 로컬 DB | expo-sqlite + Drizzle ORM, 마이그레이션은 drizzle-kit 생성 | 실무에서 많이 쓰는 조합, 타입 안전·마이그레이션 관리. ADR-0003 |
| 데이터 흐름 | 저장소 인터페이스의 구독(`observeDay`) → 화면. Zustand는 UI 상태만 | 로그인(L) 단계에서 Firestore로 구현 교체 가능 |
| 블록 겹침 | 금지 | 타임박싱 원칙, 레이아웃 단순 |
| 카테고리 | 기본 5개(업무, 공부, 운동, 생활, 휴식)만, 관리 화면은 다음 단계 | MVP 범위 |
| 블록 단위·표시 범위 | 15분, 06:00~24:00 고정 (`@pomobox/core` `config.ts`) | 설정 화면은 다음 단계 |
| 편집 UI | 바텀시트(`@gorhom/bottom-sheet`), 임시 블록 → "저장" 시 기록 | 실수 탭으로 빈 블록이 쌓이지 않음 |
| 시간 입력 | 시작 시각 ±15분 버튼 + 길이 칩(15·30·45·60·90분) | 항상 단위 정렬, 엄지 조작. 큰 이동은 A2 드래그 |
| 상태 체크 | 동그라미 탭으로 계획↔완료, 부분·건너뜀은 시트에서 | 가장 잦은 동작을 한 번에 |
| 날짜 이동 | 헤더 `‹ 날짜 ›` + "오늘" 버튼 | 달력 선택은 A2 기록 탭 |
| `time.ts` | 사용자가 직접 작성, 테스트는 Claude가 먼저 작성 | 학습 목표(작업 방식 가이드) |

## 3. 구조

### 3.1 `packages/core`

| 파일 | 내용 |
| --- | --- |
| `types.ts` | `BlockStatus = 'planned' \| 'done' \| 'partial' \| 'skipped'`, `Block`, `Category`, `NewBlock`, `BlockPatch` |
| `config.ts` | 기존 상수 + `DEFAULT_CATEGORIES`(id 고정 문자열, 이름, 색 키, 순서) |
| `time.ts` | `formatMin`, `snapMin`, `minToPx`, `pxToMin`, `overlaps`, `findConflict` (직접 작성) |
| `blockRules.ts` | `validateBlockInput(input, existingBlocks, ignoreId?)` → `BlockRuleError[]` |
| `date.ts` | `isDateString`, `addDays`, `todayString(now)` (date-fns) |
| `repository.ts` | 아래 인터페이스 |

```ts
type Block = {
  id: string
  date: string        // 'YYYY-MM-DD'
  startMin: number    // 0~1439
  endMin: number      // startMin < endMin ≤ 1440
  title: string
  categoryId: string | null
  status: BlockStatus
  memo: string | null
  createdAt: number   // epoch ms
  updatedAt: number
  deletedAt: number | null
}
type NewBlock = Pick<Block, 'date' | 'startMin' | 'endMin' | 'title' | 'categoryId'> & { status?: BlockStatus }
type BlockPatch = Partial<Pick<Block, 'startMin' | 'endMin' | 'title' | 'categoryId' | 'status' | 'memo'>>

interface BlockRepository {
  observeDay(date: string, onChange: (blocks: Block[]) => void): () => void // 시작 시각 순, 삭제 제외
  create(input: NewBlock): Promise<Block>
  update(id: string, patch: BlockPatch): Promise<Block>
  remove(id: string): Promise<void> // deletedAt만 채움
}
interface CategoryRepository {
  observeAll(onChange: (categories: Category[]) => void): () => void // sortOrder 순, 삭제 제외
}
```

`BlockRuleError` 코드: `END_NOT_AFTER_START`, `OUT_OF_DAY_RANGE`, `NOT_ALIGNED_TO_UNIT`, `OVERLAP`(겹친 블록 포함).

### 3.2 `time.ts` 동작 (테스트로 고정)

- `formatMin(min)`: `0 → "00:00"`, `615 → "10:15"`, `1440 → "24:00"`.
- `snapMin(min, unit)`: 내림. `snapMin(607, 15) → 600`.
- `minToPx(min, pxPerMin)`, `pxToMin(px, pxPerMin)`: 선형 변환. `pxToMin`은 소수점을 내림한다.
- `overlaps(a, b)`: 반열린 구간 `[start, end)`. 맞닿음(`a.end === b.start`)은 겹침이 아니다.
- `findConflict(blocks, candidate, ignoreId?)`: 겹치는 첫 블록(시작 시각 순) 또는 `null`. `ignoreId`와 같은 id, `deletedAt`이 있는 블록은 제외.

### 3.3 `apps/mobile`

```
src/
  app/
    _layout.tsx          # 마이그레이션, RepositoryProvider, GestureHandlerRootView, BottomSheetModalProvider
    index.tsx            # 오늘 화면: DateHeader + Timeline + BlockEditorSheet
  db/
    schema.ts            # drizzle 테이블 (casing: snake_case)
    client.ts            # openDatabaseSync('pomobox.db', { enableChangeListener: true }) + drizzle
    migrations/          # drizzle-kit generate 산출물
  data/
    blockRepository.ts   # createBlockRepository({ db, subscribe })
    categoryRepository.ts# createCategoryRepository({ db, subscribe }) + seedDefaultCategories(db)
    expoSubscribe.ts     # addDatabaseChangeListener 어댑터
    RepositoryProvider.tsx
  features/
    timeline/            # Timeline, BlockView, NowIndicator, useDayBlocks, useNow
    blocks/              # BlockEditorSheet(껍데기), BlockEditorForm(폼), useCategories
  stores/
    uiStore.ts           # zustand: selectedDate, editing(draft | blockId | null)
drizzle.config.ts
metro.config.js          # sourceExts에 'sql' 추가
babel.config.js          # babel-plugin-inline-import (.sql)
```

- 저장소는 `({ db, subscribe })`를 받는다. `subscribe(table, listener) → unsubscribe`. 앱은 expo-sqlite 변경 리스너 어댑터, 테스트는 수동 알림 함수를 넘긴다.
- UUID는 `expo-crypto`의 `randomUUID`, 시각은 `Date.now()`를 저장소가 채운다(테스트에서는 주입 가능하게 `now`, `newId` 옵션).

### 3.4 DB 스키마 (v1)

- `categories`: `id` text PK, `name` text, `color` text, `sort_order` int, `created_at`, `updated_at`, `deleted_at`(nullable) int.
- `blocks`: `id` text PK, `date` text, `start_min` int, `end_min` int, `title` text, `category_id` text nullable(FK categories), `status` text, `memo` text nullable, `created_at`, `updated_at`, `deleted_at` nullable int. 인덱스 `(date, start_min)`.
- 스키마 변경은 `drizzle-kit generate`로 마이그레이션을 만들어서만 한다.

## 4. 화면 동작

### 4.1 앱 시작

- `useMigrations` 진행 중에는 로딩 화면, 실패하면 오류 메시지를 보여주고 멈춘다.
- 마이그레이션 성공 후 카테고리 테이블이 비어 있을 때만 기본 카테고리 5개를 넣는다.

### 4.2 타임라인

- 06:00~24:00, `PX_PER_MIN = 2.4`(15분 = 36px). 매시 정각 라벨·구분선.
- 블록: 카테고리 색, 제목(빈 제목은 "제목 없음"), 왼쪽 상태 동그라미. 탭하면 계획↔완료 토글(부분·건너뜀 상태에서 탭하면 완료). 부분은 반 채운 동그라미, 건너뜀은 흐림+취소선.
- 현재 시간선은 오늘에만, 1분마다 갱신.
- 진입 스크롤: 오늘이면 현재 시각이 화면 위 1/3, 다른 날은 첫 블록, 없으면 06:00.
- 앱이 포그라운드로 돌아올 때 날짜가 바뀌었고 "오늘"을 보고 있었다면 새 오늘로 이동(AppState).

### 4.3 블록 만들기·편집

- 빈 칸 탭 → `snapMin(pxToMin(y))` 위치의 15분 임시 블록으로 시트 열기. "저장"해야 DB 기록, 닫으면 폐기.
- 기존 블록 탭 → 그 값으로 시트 열기, "저장"해야 반영.
- 시트: 제목, 시작 시각 ±15분, 길이 칩(15·30·45·60·90), 카테고리 칩, 상태(4개), 삭제(기존 블록만).
- 검증은 `validateBlockInput`. 오류 문구를 시트 안에 표시하고 저장 버튼 비활성화.
  - `OVERLAP`: "10:00–10:30 '헬스장'과 겹쳐요"
  - `OUT_OF_DAY_RANGE`: "06:00~24:00 안에서만 만들 수 있어요"
  - `END_NOT_AFTER_START`, `NOT_ALIGNED_TO_UNIT`: UI 조작으로는 생기지 않지만 방어적으로 문구를 둔다.
- 범위 경계에서 ±15분 버튼과 길이 칩을 비활성화한다.
- 삭제: 기본 확인 창 → 소프트 삭제 → 시트 닫기.
- DB 쓰기 실패: "저장하지 못했어요" 알림, 시트 유지.

### 4.4 날짜 이동

- 헤더 `‹ 11월 18일 (화) ›`로 하루씩, 오늘이 아닐 때 "오늘" 버튼.

## 5. 테스트

| 대상 | 도구 | 내용 |
| --- | --- | --- |
| `time.ts` | Vitest | 3.2의 동작 전부. Claude가 먼저 작성, 사용자가 구현 |
| `blockRules.ts` | Vitest | 오류 코드별, `ignoreId`, 삭제 블록 제외, 맞닿음 허용 |
| `date.ts` | Vitest | 형식 검증, 이전/다음 날, 월말·연말·윤년 경계 |
| 저장소 | Jest + `better-sqlite3` 메모리 DB + 같은 마이그레이션 | 날짜별 정렬 조회, 삭제 제외, 변경 시 재알림, 다른 날짜 변경 시 미알림, 구독 해제 후 미알림, 카테고리 시드 1회 |
| `BlockEditorForm` | Jest + RN Testing Library | 겹침 문구·저장 비활성, 경계 버튼 비활성, 길이 칩 → 끝 시각 |
| `BlockView` | Jest + RNTL | 동그라미 탭 → 상태 토글 콜백 |

E2E(Maestro)는 A2.

## 6. 작업 순서

| # | 작업 | 담당 | 선행 |
| --- | --- | --- | --- |
| 1 | core 타입·설정·`date.ts`·저장소 인터페이스, `time.ts` 시그니처와 실패 테스트 | 위임 | 없음 |
| 2 | **`time.ts` 구현** | **직접** | 1 |
| 3 | Drizzle 설정(schema, client, drizzle-kit, babel·metro), 첫 마이그레이션 | 위임 | 1 |
| 4 | 저장소 구현과 테스트(better-sqlite3), RepositoryProvider, 카테고리 시드 | 위임 | 3 |
| 5 | `blockRules.ts`와 테스트 | 위임 | 2 |
| 6 | 화면: 타임라인·날짜 헤더·현재 시간선·상태 토글 | 위임 | 2, 4 |
| 7 | 화면: 편집 시트·폼과 테스트 | 위임 | 5, 6 |
| 8 | dev 빌드 재설치(`expo-sqlite` 네이티브 모듈), 실기기 확인 | 직접 | 7 |
| 9 | ADR-0003, 가이드·PLAN 갱신, 템플릿 잔여 의존성·에셋 정리 | 위임 | 7 |

2번 동안 3·4번을 진행한다.

## 7. 완료 게이트

- [ ] 루트 `npm run check` 통과
- [ ] `time.ts` 테스트 전부 통과(직접 구현)
- [ ] 실기기: 블록 생성·수정·겹침 거부·완료 체크·부분/건너뜀·삭제·날짜 이동·앱 재시작 후 데이터 유지
- [ ] 본인 실사용 시작
- [ ] ADR-0003, `docs/learnings.md` A1-1 회고

## 8. 범위 밖

- 블록 시작 알림(A1-2), 드래그 이동·길이 조절, 집중 타이머, 회고, 기록·달력, 카테고리 관리, 설정 화면(A2 이후)
- 로그인·동기화(L), iOS, 웹 기능

## 9. 위험과 대응

| 위험 | 대응 |
| --- | --- |
| Drizzle `.sql` 마이그레이션 번들링(babel·metro)이 모노레포에서 동작하지 않음 | Expo·Drizzle 공식 가이드 설정을 `apps/mobile`에 적용, 안 되면 원인과 우회를 ADR-0003에 기록 |
| `better-sqlite3`(네이티브 Node 모듈) 설치·Jest 환경 문제 | 저장소 테스트만 node 환경으로 분리. 설치 실패 시 BLOCKED 보고 후 대안 결정 |
| `@gorhom/bottom-sheet`가 SDK 58의 reanimated/gesture-handler 버전과 비호환 | `npx expo install`로 호환 버전 확인, 비호환이면 RN `Modal` 기반 시트로 대체 |
| 사용자의 `time.ts` 구현 대기로 일정 정체 | 3·4번을 병행, 6·7번만 대기 |
