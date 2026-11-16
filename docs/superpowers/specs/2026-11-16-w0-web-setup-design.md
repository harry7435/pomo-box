# W0 · 웹 셋업 설계

- 작성일: 2026-11-16
- 상위 계획: `docs/PLAN.md`
- 범위: 로드맵 W0. W1 이후는 각각 별도 spec으로 작성한다.

## 1. 목표

기능을 만들기 전에 "코드 수정 → 검사 → GitHub 푸시 → Vercel 자동 배포" 경로를 뚫는다. W0이 끝나면 빈 Pomobox 웹 앱이 Vercel 프로덕션 URL에서 열리고, `src/core/`의 플랫폼 독립 경계가 lint로 강제되어 있어야 한다.

## 2. 확정된 결정

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 서비스 이름 | Pomobox (`package.json` name·Vercel 프로젝트: `pomobox`) | 뽀모도로 + 타임박스 콘셉트 |
| 출시 순서 | 웹 → 로그인(W3) → Android(A0~) | 스토어 심사·14일 테스트 없이 바로 실사용 |
| 웹 스택 | Vite + React + TypeScript strict | 서버 기능이 필요 없는 SPA, 익숙한 스택으로 빠른 출시 |
| 스타일 | Tailwind CSS v4 (`@tailwindcss/vite`) | 기존 스택, 앱 단계 NativeWind와 클래스 문자열 호환 |
| 테스트 | Vitest + Testing Library + jsdom | Vite와 설정 공유 |
| 배포 | Vercel, GitHub 연동 | `main` → 프로덕션, PR → 미리보기 |
| 패키지 매니저 | npm | 단순성 |
| 라우터 | W0에서는 넣지 않음. W1에서 React Router 추가 | 화면이 하나뿐 |

## 3. 저장소 구조

- Vite 앱을 저장소 루트에 둔다(모노레포는 A0에서 전환).
- `create-vite`의 `react-ts` 템플릿으로 시작하고 예제 코드(카운터, 로고 이미지, 예제 CSS)는 정리한다.
- W0이 끝났을 때 추가·변경되는 파일:

```
index.html               # <title>Pomobox</title>, lang="ko"
package.json             # name: pomobox, scripts
vite.config.ts           # react, tailwind 플러그인, vitest 설정
tsconfig*.json           # strict
eslint.config.js         # 템플릿 설정 + core 경계 규칙
vercel.json              # SPA 리라이트
src/
  main.tsx
  App.tsx                # Pomobox 제목 + 한 줄 소개
  App.test.tsx           # 렌더링 스모크 테스트
  index.css              # @import "tailwindcss";
  test/setup.ts          # @testing-library/jest-dom 등록
  core/
    README.md            # 경계 규칙 설명
    index.ts             # 빈 배럴 (W1부터 채움)
CLAUDE.md
docs/
  decisions/0001-web-first-stack.md
  learnings.md
```

## 4. 설정 상세

### 4.1 TypeScript

- 템플릿의 `tsconfig.app.json`, `tsconfig.node.json`에서 `strict: true`를 유지·확인한다.
- `npm run typecheck` = `tsc -b`.

### 4.2 ESLint와 core 경계

- 템플릿의 flat config(`typescript-eslint`, `react-hooks`, `react-refresh`)를 유지한다.
- `src/core/**` 대상 추가 규칙:
  - `no-restricted-imports`: `react`, `react-dom`, `react/*`, `react-dom/*`, `dexie`, `firebase`, `firebase/*`, 그리고 `src/core` 밖을 가리키는 상대 경로(`../*` 중 core 밖으로 나가는 것은 패턴 `../../*`로 근사)를 금지한다.
  - `no-restricted-globals`: `window`, `document`, `localStorage`, `sessionStorage`, `indexedDB`, `navigator`를 금지한다.
- 경계 규칙이 실제로 동작하는지 ESLint Node API로 검증하는 테스트를 둔다(위반 코드 문자열을 `src/core/` 경로로 lint해서 오류가 나는지 확인).

### 4.3 테스트

- Vitest, 환경 jsdom, `globals: true`, setup 파일에서 `@testing-library/jest-dom/vitest` 등록.
- 스모크 테스트: `<App />` 렌더 시 "Pomobox" 제목이 보인다.
- `npm test` = `vitest run`(watch 없음).

### 4.4 스크립트

```
dev        vite
build      tsc -b && vite build
preview    vite preview
typecheck  tsc -b
lint       eslint .
test       vitest run
check      npm run typecheck && npm run lint && npm test
```

### 4.5 Vercel

- 프레임워크 프리셋 Vite, 빌드 `npm run build`, 출력 `dist`.
- `vercel.json`: 모든 경로를 `/index.html`로 리라이트(W1 라우터 대비).

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

- GitHub 저장소(`pomobox`, 비공개)를 연결해 `main` 푸시 시 프로덕션, PR 시 미리보기 배포.

### 4.6 문서

- `CLAUDE.md`: 목적, 작업 방식(직접 작성 영역), 규칙(npm, core 경계, 시간 저장 형식, 커밋 전 `npm run check`, **커밋 메시지는 한글, Co-Authored-By 없음**), 명령어.
- `docs/decisions/0001-web-first-stack.md`: 맥락, 선택지(Expo 웹 / React+Vite / Next.js / Next+Expo 공유 UI), 결정(React+Vite 웹 우선, 게스트 로컬 저장 → W3 로그인 시 Firestore 이전), 결과.
- `docs/learnings.md`: 제목과 W0 섹션.

## 5. 작업 순서와 담당

| # | 작업 | 담당 | 선행 |
| --- | --- | --- | --- |
| 1 | Vite 프로젝트 생성·정리, TS strict, Tailwind, Vitest, 스크립트 | 위임 | 없음 |
| 2 | ESLint core 경계 규칙과 검증 테스트, `src/core` 골격 | 위임 | 1 |
| 3 | `vercel.json`, `CLAUDE.md`, ADR-0001, `docs/learnings.md` | 위임 | 1 |
| 4 | GitHub 비공개 저장소 `pomobox` 생성, 원격 연결, 푸시 | 직접 | 3 |
| 5 | Vercel 계정 연결, 프로젝트 import(`pomobox`), 첫 배포 | 직접 | 4 |
| 6 | 작은 문구 변경을 PR로 올려 미리보기 배포 확인 후 `main`에 병합 | 직접 | 5 |

## 6. 완료 게이트

- [ ] `npm run check` 통과(watch 없이 종료)
- [ ] `npm run build` 성공
- [ ] `src/core`에서 `react` import 또는 `window` 사용 시 lint 실패(검증 테스트 통과)
- [ ] Vercel 프로덕션 URL에서 "Pomobox" 화면이 열림
- [ ] PR 미리보기 URL이 생성됨
- [ ] ADR-0001 작성, `docs/learnings.md`에 W0 회고 한 단락

## 7. 범위 밖

- 라우터, Zustand, Dexie, date-fns, 화면 구현(W1)
- dnd-kit, 타이머, PWA, Playwright(W2)
- Firebase(W3), Expo·모노레포(A0)
- Prettier, git hook, GitHub Actions CI(Vercel 빌드가 기본 검사 역할)

## 8. 위험과 대응

| 위험 | 대응 |
| --- | --- |
| `pomobox.vercel.app`이 이미 사용 중 | Vercel이 다른 서브도메인을 붙인다. 커스텀 도메인은 나중에 결정 |
| 경계 규칙의 상대 경로 패턴이 정상 import까지 막음 | 검증 테스트에 "허용되어야 하는 core 내부 import" 케이스도 넣는다 |
| Vercel 빌드가 로컬과 다른 Node 버전으로 실패 | `package.json` `engines.node`를 `">=24"`로 명시 |
