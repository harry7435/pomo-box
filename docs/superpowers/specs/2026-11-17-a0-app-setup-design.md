# A0 · 모노레포 전환과 앱 셋업 설계

- 작성일: 2026-11-17
- 상위 계획: `docs/PLAN.md`
- 대체 문서: `2026-11-16-phase0-setup-design.md`(보류 문서)의 결정을 이어받아 모노레포 구조와 Pomobox 이름으로 갱신한다.
- 범위: 로드맵 A0. A1(앱 MVP) 이후는 별도 spec.

## 1. 목표

앱 기능을 만들기 전에 두 가지를 끝낸다.

1. 저장소를 npm workspaces 모노레포로 바꿔 웹·앱이 `@pomobox/core`를 공유하게 한다.
2. 빈 Pomobox Expo 앱이 "코드 수정 → 실제 기기 확인 → Play 내부 테스트 트랙 배포" 경로를 통과하게 한다.

A0이 끝나면 dev 앱과 Play 내부 테스트 앱이 같은 Android 폰에 나란히 설치되어 있고, 두 앱 모두 core에서 가져온 값을 화면에 보여준다.

## 2. 확정된 결정

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 개발 순서 | 앱 먼저(A0~A3), 웹 W1 이후와 로그인은 앱 출시 뒤 | 사용자 결정(2026-11-17) |
| 저장소 구조 | npm workspaces 모노레포: `apps/web`, `apps/mobile`, `packages/core` | core 공유. Turborepo 등은 쓰지 않음(YAGNI) |
| core 패키지 | 이름 `@pomobox/core`, TS 소스를 그대로 export(빌드 단계 없음) | Vite와 Metro 모두 워크스페이스 TS 소스를 직접 번들 가능 |
| 출시 순서 | Android 먼저, iOS는 도전 단계 | 테스트 기기가 Android 폰 |
| 패키지 ID | prod `com.ikjun.pomobox`, dev `com.ikjun.pomobox.dev` (iOS bundleIdentifier 동일) | 역도메인 관례, `.dev` 접미사로 두 빌드 동시 설치 |
| 앱 이름 | prod `Pomobox`, dev `Pomobox (Dev)` | |
| 빌드 파이프라인 | 개발은 로컬 `expo run:android`, 출시는 EAS Build + EAS Submit | 보류 문서 ADR 내용 계승. EAS 무료 빌드 횟수 절약 |
| 네이티브 폴더 | `android/`, `ios/`는 커밋하지 않음(CNG) | 네이티브 설정은 `app.config.ts`·config plugin으로만 |
| 앱 테스트 | Jest(`jest-expo`) | Expo 표준. core·웹은 Vitest 유지 |
| 패키지 매니저 | npm. Expo 의존성은 `apps/mobile`에서 `npx expo install` | |
| 웹 | `apps/web`으로 옮기고 빌드·배포만 유지(기능 개발 보류) | |

## 3. 저장소 구조

```
package.json              # private, workspaces: ["apps/*", "packages/*"], 루트 스크립트
package-lock.json         # 하나만 둔다
apps/
  web/                    # 기존 Vite 앱 이동 (src/, index.html, vite.config.ts, tsconfig*, eslint.config.js, vercel.json)
  mobile/                 # Expo 앱
    app/                  # Expo Router: _layout.tsx, index.tsx
    app.config.ts         # dev/prod 변형
    eas.json
    __tests__/
packages/
  core/
    package.json          # name @pomobox/core, exports → src/index.ts
    src/index.ts, src/config.ts
    README.md             # 기존 src/core/README.md 이동
    eslint.config.js      # 경계 규칙 이동
    tests/core-boundary.test.ts
docs/
```

- 기존 `src/core/*`는 `packages/core/src/*`로 옮긴다(`git mv`로 이력 유지).
- `docs/`, `CLAUDE.md`, `.gitignore`는 루트에 남는다.

## 4. 상세

### 4.1 루트 스크립트

```
check   npm run check --workspaces --if-present
test    npm test --workspaces --if-present
```

각 워크스페이스가 자기 `check`(typecheck → lint → test)를 가진다.

### 4.2 `@pomobox/core`

- `package.json`: `"name": "@pomobox/core"`, `"private": true`, `"type": "module"`, `"exports": { ".": "./src/index.ts" }`.
- 런타임 의존성 없음. 개발 도구: TypeScript, ESLint, Vitest.
- A0에서는 W1 메모의 `config.ts`(`BLOCK_UNIT_MIN`, `DAY_START_MIN`, `DAY_END_MIN`)만 추가해 공유가 동작하는지 증명한다.
- 경계 규칙:
  - 금지 import에 `react-native`, `react-native/*`, `expo`, `expo-*`, `@expo/*`를 추가한다(웹 금지 목록 유지).
  - 전역 금지 목록은 유지한다.
  - 상대 경로 규칙은 패키지 루트 기준으로 다시 맞춘다: `src/*.ts`는 `'../*'`·`'..'`로 `src` 밖에 나갈 수 없고, 하위 폴더 1단계까지 허용, 2단계 이상 금지(기존 규칙 유지).
- 경계 테스트는 경로만 바꿔 그대로 옮기고, 추가한 금지 패키지 케이스(`react-native`, `expo-sqlite`)를 넣는다.

### 4.3 `apps/web`

- 동작 변경 없음. `App.tsx`가 `@pomobox/core`의 `BLOCK_UNIT_MIN`을 import해 소개 문구에 쓴다("15분 블록으로 하루를 나누고…")로 공유를 검증한다.
- 웹 ESLint의 core 경계 블록은 제거한다(규칙은 core 패키지가 소유).
- `vercel.json`은 `apps/web/vercel.json`으로 옮긴다. Vercel Root Directory를 `apps/web`으로 바꾼다(직접, PR 생성 시점).

### 4.4 `apps/mobile`

- `create-expo-app` 최신 안정 SDK 기본 템플릿에서 예제 코드를 정리하고 최소 화면만 남긴다.
- `app/index.tsx`: "Pomobox" 제목과 `@pomobox/core`의 `BLOCK_UNIT_MIN`을 쓴 문구.
- `app.config.ts`: `APP_VARIANT === 'development'`일 때만 dev 이름·ID, 그 외(미설정·오타 포함)는 prod. `slug`·`scheme`은 `pomobox`로 공유. 정적 필드(아이콘 등) 보존.
- `eas.json`: `development`(developmentClient, internal, `APP_VARIANT=development`), `preview`(internal APK), `production`(AAB, `autoIncrement`), `cli.appVersionSource: remote`, `submit.production.android`(track `internal`, `serviceAccountKeyPath: ./secrets/play-service-account.json`).
- 의존성: `expo-dev-client`. 스크립트 `android:dev` = `APP_VARIANT=development expo run:android`, `check`.
- 테스트: `app.config.ts` 변형 테스트(오타 시 prod, 정적 필드 보존), `eas.json` 프로필 테스트(production·preview에 dev 변형이 섞이지 않음).
- Metro가 워크스페이스 패키지를 해석하는지 확인한다(최신 Expo는 모노레포 자동 설정). 안 되면 `metro.config.js`를 추가하고 ADR에 남긴다.

### 4.5 `.gitignore`

`android/`, `ios/`(apps/mobile 아래), `secrets/`, `*.jks`, `*.keystore`, `.superpowers/`, `.omc/`.

### 4.6 문서

- `docs/PLAN.md` 로드맵은 spec 작성 시점에 이미 갱신했다. 구현 후 기술 스택·폴더 구조 절을 모노레포에 맞게 고친다.
- `docs/guides/commands.md`, `conventions.md`: 워크스페이스 명령, core 경로 갱신.
- `docs/decisions/0002-app-first-monorepo.md`: 앱 우선 전환과 모노레포 결정(+ 보류 문서의 빌드 파이프라인 결정 계승).
- 보류 문서(`2026-11-16-phase0-setup-*`)는 "A0 spec으로 대체됨" 표시.

## 5. 작업 순서와 담당

| # | 작업 | 담당 | 선행 |
| --- | --- | --- | --- |
| 1 | Google Play 개발자 계정 등록(개인, $25, 본인 인증) | 직접 | 없음 — 가장 먼저 |
| 2 | 모노레포 전환: 루트 workspaces, `apps/web` 이동, `packages/core` 분리, 경계 규칙·테스트 이동, 웹이 core import | 위임 | 없음 |
| 3 | Expo 앱 생성, 최소 화면(core import), `app.config.ts`, `eas.json`, 테스트 | 위임 | 2 |
| 4 | 문서 갱신(PLAN 스택·폴더 절, guides, ADR-0002, 보류 문서 표시) | 위임 | 3 |
| 5 | Expo 계정, `eas login`, `eas init`(projectId 연결) | 직접 | 3 |
| 6 | PR 생성 직전 Vercel Root Directory를 `apps/web`으로 저장 → PR 미리보기로 웹 빌드 확인 | 직접 | 4 |
| 7 | 폰 USB 디버깅, `npm run android:dev`로 dev 빌드 설치, Fast Refresh 확인 | 직접 | 3 |
| 8 | `eas build --profile production --platform android` | 직접 | 5 |
| 9 | Play Console 앱 생성, 첫 AAB 내부 테스트 트랙 수동 업로드, 본인 테스터 등록 | 직접 | 1, 8 |
| 10 | 서비스 계정 키 발급(`apps/mobile/secrets/`), Play Console 권한 | 직접 | 9 |
| 11 | 문구 수정 후 `eas build` → `eas submit`으로 두 번째 업로드 | 직접 | 10 |

## 6. 완료 게이트

- [ ] 루트 `npm run check` 통과(모든 워크스페이스)
- [ ] core 경계 테스트 통과(웹·RN·Expo 패키지 import 거부 포함)
- [ ] Vercel 미리보기·프로덕션이 `apps/web`에서 정상 빌드, 화면에 core 값 표시
- [ ] `APP_VARIANT` 유무에 따라 `npx expo config --type public`의 이름·패키지 ID가 4.4대로 나옴
- [ ] 폰에 "Pomobox (Dev)" 설치, Fast Refresh 동작, core 값 표시
- [ ] 같은 폰에 Play 내부 테스트판 "Pomobox"가 나란히 설치
- [ ] `eas submit`으로 올린 두 번째 빌드가 트랙에 반영
- [ ] ADR-0002 작성, `docs/learnings.md`에 A0 회고

## 7. 범위 밖

- 앱 기능(타임라인, SQLite, 블록 CRUD) — A1
- 스타일링 방식(NativeWind / StyleSheet) 결정 — A1
- 웹 기능 개발, 로그인, iOS, CI

## 8. 위험과 대응

| 위험 | 대응 |
| --- | --- |
| Metro가 워크스페이스 TS 소스를 해석하지 못함 | Expo 모노레포 가이드대로 `metro.config.js` 추가, ADR 기록 |
| React 버전이 웹(Vite 템플릿)과 Expo SDK 사이에 달라 호이스팅 충돌 | 각 앱이 자기 React를 `dependencies`에 명시. 충돌 시 Expo가 요구하는 버전에 맞추고 웹을 따라가게 함 |
| Vercel 설정 저장 시점 실수로 main 빌드 실패 | PR 생성 직전에 저장. 실패해도 기존 배포는 유지됨 |
| Play 계정 승인 지연 | 1번을 먼저 시작, 2~7을 병행 |
| 서비스 계정 키·서명 키 유출 | `secrets/` gitignore, 저장소 밖 백업 |
