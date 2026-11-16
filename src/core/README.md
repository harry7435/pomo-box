# src/core

웹(React)과 앱(React Native)이 함께 쓸 플랫폼 독립 코드. A0 단계에서 `packages/core`로 옮긴다.

## 규칙 (eslint.config.js가 강제)

- `react`, `react-dom`, `dexie`, `firebase`, `@firebase/*`를 import하지 않는다.
- `window`, `document`, `localStorage`, `sessionStorage`, `indexedDB`, `navigator`를 쓰지 않는다.
- `src/core` 밖의 모듈을 상대 경로로 import하지 않는다.
- 하위 폴더는 1단계까지만 둔다(`src/core/foo/bar.ts`까지). 경계 규칙이 이 깊이를 기준으로 동작한다.
- 저장소·시계·알림처럼 플랫폼에 따라 다른 기능은 인터페이스만 정의하고, 구현은 core 밖에서 주입한다.
