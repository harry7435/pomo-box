// 블록 단위와 타임라인 표시 범위. 설정 화면이 생기기 전까지의 고정값이다.
export const BLOCK_UNIT_MIN = 15
export const DAY_START_MIN = 6 * 60
export const DAY_END_MIN = 24 * 60

// 첫 실행 때 넣는 기본 카테고리. id는 기기마다 같아야 나중에 동기화할 때 같은 카테고리로 합쳐진다.
export const DEFAULT_CATEGORIES = [
  { id: 'cat-work', name: '업무', color: 'blue', sortOrder: 0 },
  { id: 'cat-study', name: '공부', color: 'purple', sortOrder: 1 },
  { id: 'cat-exercise', name: '운동', color: 'green', sortOrder: 2 },
  { id: 'cat-life', name: '생활', color: 'orange', sortOrder: 3 },
  { id: 'cat-rest', name: '휴식', color: 'gray', sortOrder: 4 },
] as const
