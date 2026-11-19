# 개발 규칙

## 도구

- 패키지 매니저는 npm, 구조는 npm workspaces 모노레포다(`apps/web`, `apps/mobile`, `packages/core`). `package-lock.json`은 루트에 하나만 둔다.
- 앱의 Expo 관련 의존성은 `apps/mobile`에서 `npx expo install`로 설치한다(SDK 호환 버전).
- React 버전은 웹과 앱이 같은 값(Expo SDK가 요구하는 버전)으로 고정한다.
- ESLint는 웹·core가 10, 앱이 9를 쓴다. `eslint-config-expo`의 플러그인이 ESLint 10을 지원하지 않아서다. 루트 `package.json`의 `devDependencies.eslint`(10)는 v10이 루트에 호이스팅되도록 고정하는 용도이고, `apps/mobile`은 자기 `node_modules`에 v9를 가진다. 그래서 `npm ls eslint`는 peer 경고로 실패하지만 `npm run check`는 정상이다. Expo SDK를 올릴 때 `eslint-config-expo`가 v10을 지원하면 앱도 10으로 맞추고 이 항목을 지운다. `apps/mobile`은 `eslint-import-resolver-typescript`를 devDependency로 두어 루트로 호이스팅되게 한다. 없으면 `expo lint`가 "typescript with invalid interface loaded as resolver"로 실패한다.

## 코드 경계

- `packages/core`(`@pomobox/core`)는 웹과 앱이 공유할 플랫폼 독립 패키지다. 세부 규칙은 [`packages/core/README.md`](../../packages/core/README.md)에 있고 ESLint가 강제한다.
- 앱의 `android/`, `ios/`는 생성물이라 커밋하지 않는다. 네이티브 설정은 `apps/mobile/app.config.ts`와 config plugin으로만 바꾼다.
- 키 파일(서비스 계정, keystore)은 `apps/mobile/secrets/` 또는 저장소 밖에 두고 절대 커밋하지 않는다.

## 데이터

- 시간은 날짜 문자열(`YYYY-MM-DD`)과 자정부터의 분(0~1439)으로 저장한다. 타이머 구간처럼 실제 시각이 필요한 값만 epoch ms로 저장한다.
- id는 UUID다. 모든 레코드에 `updated_at`과 `deleted_at`(소프트 삭제)을 둔다.
- 저장 스키마 변경은 버전 관리로만 한다(웹은 Dexie `version()`, 앱은 Drizzle 마이그레이션).
- 앱 DB 스키마는 `apps/mobile/src/db/schema.ts`에서 바꾸고, `npm run db:generate -w @pomobox/mobile`로 마이그레이션을 만들어 함께 커밋한다(ADR-0003).
- 테이블 정의는 [`docs/PLAN.md`의 데이터 모델](../PLAN.md#데이터-모델)을 따른다.

## 커밋

- 커밋 전에 `npm run check`(tsc, eslint, vitest)가 통과해야 한다.
- 커밋 메시지는 한글로 쓴다. 접두어 `feat:`/`fix:`/`chore:`/`docs:`/`test:`는 유지한다.
- Co-Authored-By 트레일러는 붙이지 않는다.
