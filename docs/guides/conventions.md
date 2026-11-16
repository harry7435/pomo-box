# 개발 규칙

## 도구

- 패키지 매니저는 npm이다.

## 코드 경계

- `src/core`는 웹과 앱이 공유할 플랫폼 독립 영역이다. 세부 규칙은 [`src/core/README.md`](../../src/core/README.md)에 있고 ESLint가 강제한다.

## 데이터

- 시간은 날짜 문자열(`YYYY-MM-DD`)과 자정부터의 분(0~1439)으로 저장한다. 타이머 구간처럼 실제 시각이 필요한 값만 epoch ms로 저장한다.
- id는 UUID다. 모든 레코드에 `updated_at`과 `deleted_at`(소프트 삭제)을 둔다.
- 저장 스키마 변경은 버전 관리로만 한다(웹은 Dexie `version()`, 앱은 Drizzle 마이그레이션).
- 테이블 정의는 [`docs/PLAN.md`의 데이터 모델](../PLAN.md#데이터-모델)을 따른다.

## 커밋

- 커밋 전에 `npm run check`(tsc, eslint, vitest)가 통과해야 한다.
- 커밋 메시지는 한글로 쓴다. 접두어 `feat:`/`fix:`/`chore:`/`docs:`/`test:`는 유지한다.
- Co-Authored-By 트레일러는 붙이지 않는다.
