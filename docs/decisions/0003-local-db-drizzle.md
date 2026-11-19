# ADR-0003: 앱 로컬 DB — expo-sqlite + Drizzle ORM

- 상태: 채택
- 날짜: 2026-11-19

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
- React Native Testing Library 14는 비동기 API라 렌더·이벤트 호출을 `await`로 처리한다.
- jest에서 바텀시트는 `@gorhom/bottom-sheet/mock`을 써서 렌더한다.
- `better-sqlite3` 13은 Node 26에서 별도 우회 없이 동작했다.
