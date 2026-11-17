# ADR-0002: 앱 우선 전환과 npm workspaces 모노레포

- 상태: 채택
- 날짜: 2026-11-17
- 관련: ADR-0001(웹 우선 스택)의 순서 결정을 대체한다. 스택 선택(React + Vite 웹, 게스트 로컬 저장 → 로그인 시 서버 이전)은 유지한다.

## 맥락

웹 W0(셋업·배포)을 마친 뒤 W1 설계 도중, 앱을 먼저 개발하기로 했다. 웹은 기능 개발을 보류하되 배포는 유지한다. W1에서 정한 화면·데이터 결정은 앱 A1에 옮겨 쓴다(`docs/superpowers/specs/2026-11-17-w1-web-mvp-notes.md`).

## 결정

1. **순서:** A0(모노레포·앱 셋업) → A1~A3(앱 MVP, 인터랙션, Play 출시) → 로그인·서버 저장 → 웹 W1~W2.
2. **구조:** npm workspaces 모노레포 — `apps/web`, `apps/mobile`, `packages/core`. Turborepo 등 빌드 오케스트레이터는 쓰지 않는다.
3. **core 공유:** `@pomobox/core`는 빌드 없이 TS 소스를 export한다. 경계 규칙(ESLint)과 검증 테스트를 core 패키지가 소유한다.
4. **앱 빌드·배포:** 개발은 로컬 `expo run:android`, 출시는 EAS Build + EAS Submit. Android 먼저. `android/`, `ios/`는 커밋하지 않는다(CNG).
5. **React 버전:** 웹과 앱 모두 Expo SDK가 요구하는 버전(현재 19.3.0)으로 고정한다.

## 선택지 (구조)

- **npm workspaces 모노레포(채택):** 저장소 하나, lock 파일 하나, core를 심볼릭 링크로 공유.
- **앱을 별도 저장소로:** 설정이 단순하지만 core를 복사하거나 패키지로 배포해야 한다.
- **Expo 하나로 웹·앱 통합:** Vite 웹을 버리고 react-native-web으로 옮기는 비용이 들고, 웹 품질이 떨어진다.

## 결과

- 웹과 앱이 같은 core 코드를 쓰고, 경계 규칙이 RN·Expo 의존까지 막는다.
- Vercel은 Root Directory를 `apps/web`으로 바꿔야 한다.
- 로그인이 앱 출시 뒤로 밀려, 그 전까지 앱 데이터는 기기 안에만 있다.
- 호이스팅된 의존성 버전(특히 React)이 어긋나면 런타임 오류가 날 수 있어 버전을 고정한다.
