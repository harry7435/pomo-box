# W1 · 웹 MVP 설계 메모 (보류)

- 작성일: 2026-11-17
- 상태: **보류.** 앱 우선으로 로드맵이 바뀌어 브레인스토밍 도중 멈췄다. 아래 결정은 앱 A1에 그대로 옮겨 쓰고, 웹을 재개할 때 이 메모에서 이어간다.

## 확정된 결정

| 항목 | 결정 |
| --- | --- |
| 블록 겹침 | 막는다. 저장 시 겹침 검사 후 거부하고 안내 |
| 카테고리 | 기본 카테고리 5개(업무, 공부, 운동, 생활, 휴식)만 넣고 블록에서 선택. 관리 화면은 다음 단계 |
| 블록 단위·표시 범위 | 15분, 06:00~24:00 고정. 값은 core `config.ts`에 모은다. 설정 화면은 다음 단계 |
| 지원 기기 | PC와 폰 모두 (반응형) |
| 블록 편집 UI | PC는 타임라인 옆 패널, 폰은 바텀시트. 편집 폼은 하나, 감싸는 틀만 화면 크기에 따라 다름 |
| 블록 생성 | 빈 칸 클릭/탭 → 15분 블록 생성 → 편집 UI 열림 |
| 상태 체크 | 블록의 동그라미 버튼으로 바로 "완료". "부분"·"건너뜀"은 편집 UI에서 선택 |
| 날짜 이동 | 이전/다음 날, 오늘 버튼, 기본 날짜 선택기. 날짜는 URL(`/day/YYYY-MM-DD`) |
| 데이터 흐름 | 저장소가 변경을 구독으로 알려주는 방식(아래 인터페이스). Zustand는 UI 상태에만 사용 |

## 설계 초안 (1/3 · 구조, 사용자 승인 전)

**`core`**

- `types.ts`: `Block`, `Category`, `BlockStatus`(`planned | done | partial | skipped`). 필드는 camelCase.
- `config.ts`: `BLOCK_UNIT_MIN = 15`, `DAY_START_MIN = 360`, `DAY_END_MIN = 1440`.
- `time.ts` (**사용자가 직접 작성**, 테스트는 Claude가 먼저 작성): `formatMin`, `snapMin`, `minToPx`, `pxToMin`, `overlaps`, `findConflict`.
- `blockRules.ts`: `validateBlockInput()` — 시작 < 끝, 표시 범위 안, 단위 정렬, 겹침 없음. 오류 코드 반환.
- `date.ts`: 날짜 문자열 검증, 이전/다음 날(date-fns).
- `repository.ts`:

```ts
interface BlockRepository {
  observeDay(date: string, onChange: (blocks: Block[]) => void): () => void
  create(input: NewBlock): Promise<Block>
  update(id: string, patch: BlockPatch): Promise<Block>
  remove(id: string): Promise<void> // 소프트 삭제
}
interface CategoryRepository {
  observeAll(onChange: (categories: Category[]) => void): () => void
}
```

- UUID와 현재 시각은 core 밖 구현이 채운다.

**웹 구현 (보류)**

- `data/dexie`: 스키마 v1(`blocks`: `id, date, [date+startMin]` / `categories`: `id, sortOrder`), 저장소 구현, 기본 카테고리 시드.
- `features/timeline`(Timeline, BlockView, NowIndicator), `features/blocks`(BlockEditor, EditorShell, useDayBlocks).
- 라우트 `/` → `/day/<오늘>`, 잘못된 날짜는 오늘로.
- 의존성: `react-router`, `dexie`, `zustand`, `date-fns`, (dev) `fake-indexeddb`. `dexie-react-hooks`는 쓰지 않는다.

## 남은 설계

- 2/3 화면 동작과 오류 처리, 3/3 테스트 전략은 다루지 못했다.
