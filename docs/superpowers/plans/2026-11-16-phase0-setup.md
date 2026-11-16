> **보류 (2026-11-16):** 웹 우선으로 로드맵이 바뀌어 이 문서는 A0(앱 셋업) 단계용으로 보류한다. 재개할 때 다음을 갱신한다: 패키지 ID `com.ikjun.timebox` → `com.ikjun.pomobox`, 앱 이름 Timebox → Pomobox, 모노레포 경로(`apps/mobile`, `packages/core`), 커밋 메시지 한글·Co-Authored-By 없음. 최신 계획은 `docs/PLAN.md`.

# Phase 0 · 셋업과 배포 파이프라인 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 빈 Expo 앱을 dev/prod 변형으로 분리해 로컬 개발 빌드와 Play 내부 테스트 트랙 배포가 모두 가능한 상태로 만든다.

**Architecture:** Expo(최신 안정 SDK, Expo Router) 앱을 저장소 루트에 두고, `app.config.ts`가 `APP_VARIANT` 환경 변수로 이름·패키지 ID를 분기한다. 개발은 `expo run:android`(로컬), 출시는 `eas.json`의 production 프로필로 EAS Build·Submit을 쓴다. `android/`, `ios/`는 커밋하지 않는다(CNG).

**Tech Stack:** Expo SDK(생성 시점 최신 안정), Expo Router, TypeScript strict, ESLint(eslint-config-expo), Jest(jest-expo), expo-dev-client, EAS CLI, npm

**Spec:** `docs/superpowers/specs/2026-11-16-phase0-setup-design.md`

## Global Constraints

- 패키지 매니저는 npm. Expo 관련 의존성 설치는 반드시 `npx expo install`(SDK 호환 버전 선택).
- prod 패키지 ID `com.ikjun.timebox`, dev 패키지 ID `com.ikjun.timebox.dev`. Android `package`와 iOS `bundleIdentifier`에 같은 값.
- 앱 이름: dev `Timebox (Dev)`, prod `Timebox`. `slug`는 `timebox`로 두 변형이 공유.
- `process.env.APP_VARIANT === 'development'`일 때만 dev, 그 외 모든 값(미설정 포함)은 prod.
- `android/`, `ios/`, `secrets/`는 git에 올리지 않는다.
- 서비스 계정 키 경로: `./secrets/play-service-account.json`.
- 커밋 전 `npm run check`(tsc → lint → jest) 통과. Prettier, husky, CI는 추가하지 않는다.
- 작업 브랜치: `phase-0-setup`.

## Review Focus

- `APP_VARIANT`에 오타(`dev`, `Development`)가 있으면 조용히 prod ID로 빌드된다 → spec대로 prod로 떨어지되, 그 동작을 테스트로 고정한다(Task 2).
- 동적 config가 `app.json`의 정적 필드(아이콘, adaptiveIcon, plugins, scheme)를 덮어써서 잃어버리면 안 된다 → 보존 테스트(Task 2).
- EAS production/preview 프로필에 `APP_VARIANT=development`가 섞이면 스토어에 dev ID로 올라간다 → `eas.json` 테스트(Task 2).
- 서비스 계정 키나 `android/` 폴더가 실수로 커밋되면 안 된다 → `git check-ignore` 검증(Task 1).
- `npm test`가 watch 모드로 떠서 `npm run check`가 끝나지 않으면 안 된다 → 스크립트는 `jest`(watch 없음), 종료 확인(Task 2).

---

## Part A · 위임 작업 (서브에이전트)

### Task 1: Expo 프로젝트 스캐폴드와 기본 도구

**Files:**
- Create (스캐폴드에서 복사): `package.json`, `package-lock.json`, `app.json`, `tsconfig.json`, `.gitignore`, `assets/**`, `eslint.config.js`, 기타 템플릿 루트 파일
- Create: `app/_layout.tsx`, `app/index.tsx`
- Delete: 템플릿 예제 코드(`components/`, `hooks/`, `constants/`, `scripts/`, 예제 라우트)

**Interfaces:**
- Consumes: 없음
- Produces: `npm run typecheck`, `npm run lint` 스크립트. `app.json`의 `expo.slug === "timebox"`, `expo.scheme === "timebox"`. Expo Router 루트는 `app/`.

- [ ] **Step 1: 스캐폴드를 임시 폴더에 생성**

저장소 루트가 비어 있지 않으므로 scratchpad에 만든 뒤 복사한다.

```bash
SCAFFOLD_DIR=/private/tmp/claude-501/-Users-jun2-develop-time-boxing/d4a8f4c6-0de9-4d79-943e-c3880fc4370c/scratchpad
cd "$SCAFFOLD_DIR" && rm -rf timebox && npx create-expo-app@latest timebox --template default --no-install
ls -la "$SCAFFOLD_DIR/timebox"
```

Expected: `timebox/` 안에 `package.json`, `app.json`, `tsconfig.json`, 라우트 폴더(`app/` 또는 `src/app/`)가 있다. 사용된 SDK 버전(`package.json`의 `expo` 버전)을 기록해 둔다.

- [ ] **Step 2: 저장소 루트로 복사하고 의존성 설치**

```bash
rsync -a --exclude .git --exclude node_modules "$SCAFFOLD_DIR/timebox/" /Users/jun2/develop/time-boxing/
cd /Users/jun2/develop/time-boxing && npm install
```

Expected: `npm install`이 오류 없이 끝난다. 기존 파일(`타임박싱 앱 (React Native) 계획 초안.md`, `docs/`, `.omc/`)은 그대로 있다.

- [ ] **Step 3: 템플릿 예제 코드 제거**

- 라우트 폴더(`app/` 또는 `src/app/`)의 내용을 모두 지운다.
- `components/`, `hooks/`, `constants/`, `scripts/` 폴더가 있으면 지운다(경로가 `src/` 아래면 그쪽).
- `package.json` `scripts`에서 `reset-project`를 지운다.
- 템플릿이 `src/app`을 쓰거나 `app.json`의 `expo-router` 플러그인에 `root` 옵션이 있으면 그 옵션을 지우고 라우트 루트를 저장소 루트의 `app/`로 둔다. 빈 `src/`는 지운다.
- `assets/`는 유지한다. 단, 지운 예제 코드에서만 쓰던 이미지라도 `app.json`이 참조하는 아이콘·스플래시는 남긴다.

```bash
cd /Users/jun2/develop/time-boxing && grep -rn "components/\|hooks/\|constants/" app.json tsconfig.json package.json || echo "no stale refs"
```

Expected: `no stale refs` 또는 남은 참조가 없도록 정리된 상태.

- [ ] **Step 4: 최소 라우트 작성**

`app/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`app/index.tsx`:

```tsx
import { StyleSheet, Text, View } from 'react-native';

export default function TodayScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Timebox</Text>
      <Text>Phase 0 · 배포 파이프라인 확인용 화면</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '600' },
});
```

- [ ] **Step 5: TypeScript strict 확인과 스크립트 정리**

`tsconfig.json`의 `compilerOptions.strict`가 `true`인지 확인하고, 아니면 `true`로 둔다.

`package.json` `scripts`에 다음이 있도록 맞춘다(기존 `start`, `android`, `ios`, `web`은 유지):

```json
"typecheck": "tsc --noEmit",
"lint": "expo lint"
```

`eslint.config.js`가 없으면 `npx expo lint`를 한 번 실행해 생성한다(`eslint`, `eslint-config-expo`가 devDependencies에 추가됨).

- [ ] **Step 6: `.gitignore` 보강**

템플릿 `.gitignore`에 다음 줄이 없으면 끝에 추가한다:

```gitignore
# Native (Continuous Native Generation)
/android
/ios

# Secrets
secrets/
*.jks
*.keystore

# Local tooling
.omc/
```

- [ ] **Step 7: 검증**

```bash
cd /Users/jun2/develop/time-boxing
npm run typecheck && npm run lint
git check-ignore -v android ios secrets/play-service-account.json .omc
npx expo-doctor
```

Expected: typecheck·lint 통과. `git check-ignore`가 네 경로 모두에 대해 매칭 규칙을 출력한다. `expo-doctor`는 실패 항목 없음(네트워크 경고는 허용, 내용은 보고).

- [ ] **Step 8: Commit**

```bash
git add -A -- . ':!타임박싱 앱 (React Native) 계획 초안.md'
git status --short   # .omc/, android/, node_modules/ 가 없어야 함
git commit -m "chore: scaffold Expo app with TypeScript strict and ESLint"
```

---

### Task 2: dev/prod 변형 설정과 EAS 프로필

**Files:**
- Create: `app.config.ts`
- Create: `eas.json`
- Create: `__tests__/app.config.test.ts`
- Create: `__tests__/eas.config.test.ts`
- Modify: `package.json` (jest 설정, 스크립트)

**Interfaces:**
- Consumes: Task 1의 `app.json`(`slug: "timebox"`, `scheme: "timebox"`), `npm run typecheck`, `npm run lint`
- Produces: `app.config.ts` 기본 export `(ctx: ConfigContext) => ExpoConfig`. 스크립트 `npm test`, `npm run check`, `npm run android:dev`. `eas.json` 프로필 `development` / `preview` / `production`, submit 프로필 `production`.

- [ ] **Step 1: Jest와 dev client 설치**

```bash
cd /Users/jun2/develop/time-boxing
npx expo install expo-dev-client
npx expo install jest-expo jest @types/jest -- --save-dev
```

`package.json`에 추가:

```json
"jest": {
  "preset": "jest-expo"
}
```

`scripts`에 추가(템플릿에 `"test": "jest --watchAll"`이 있으면 교체):

```json
"test": "jest",
"check": "npm run typecheck && npm run lint && npm test",
"android:dev": "APP_VARIANT=development expo run:android"
```

- [ ] **Step 2: app.config 실패 테스트 작성**

`__tests__/app.config.test.ts`:

```ts
import type { ConfigContext, ExpoConfig } from 'expo/config';

import getConfig from '../app.config';

const baseConfig: Partial<ExpoConfig> = {
  name: 'timebox',
  slug: 'timebox',
  scheme: 'timebox',
  android: { adaptiveIcon: { backgroundColor: '#ffffff' } },
  ios: { supportsTablet: true },
  plugins: ['expo-router'],
};

const originalVariant = process.env.APP_VARIANT;

function resolveWith(variant: string | undefined): ExpoConfig {
  if (variant === undefined) {
    delete process.env.APP_VARIANT;
  } else {
    process.env.APP_VARIANT = variant;
  }
  return getConfig({ config: baseConfig } as ConfigContext);
}

afterEach(() => {
  if (originalVariant === undefined) {
    delete process.env.APP_VARIANT;
  } else {
    process.env.APP_VARIANT = originalVariant;
  }
});

describe('app.config', () => {
  it('uses dev name and ids when APP_VARIANT=development', () => {
    const config = resolveWith('development');
    expect(config.name).toBe('Timebox (Dev)');
    expect(config.android?.package).toBe('com.ikjun.timebox.dev');
    expect(config.ios?.bundleIdentifier).toBe('com.ikjun.timebox.dev');
  });

  it('uses prod name and ids when APP_VARIANT is unset', () => {
    const config = resolveWith(undefined);
    expect(config.name).toBe('Timebox');
    expect(config.android?.package).toBe('com.ikjun.timebox');
    expect(config.ios?.bundleIdentifier).toBe('com.ikjun.timebox');
  });

  it.each(['production', 'dev', 'Development', ''])(
    'treats APP_VARIANT=%p as production',
    (variant) => {
      const config = resolveWith(variant);
      expect(config.name).toBe('Timebox');
      expect(config.android?.package).toBe('com.ikjun.timebox');
    },
  );

  it('shares slug and scheme across variants', () => {
    expect(resolveWith('development').slug).toBe('timebox');
    expect(resolveWith(undefined).slug).toBe('timebox');
    expect(resolveWith('development').scheme).toBe('timebox');
  });

  it('preserves static android, ios and plugin fields from app.json', () => {
    const config = resolveWith('development');
    expect(config.android?.adaptiveIcon).toEqual({ backgroundColor: '#ffffff' });
    expect(config.ios?.supportsTablet).toBe(true);
    expect(config.plugins).toEqual(['expo-router']);
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `npx jest __tests__/app.config.test.ts`
Expected: FAIL — `Cannot find module '../app.config'`

- [ ] **Step 4: `app.config.ts` 구현**

```ts
import type { ConfigContext, ExpoConfig } from 'expo/config';

const PROD_ID = 'com.ikjun.timebox';
const DEV_ID = `${PROD_ID}.dev`;

export default ({ config }: ConfigContext): ExpoConfig => {
  const isDev = process.env.APP_VARIANT === 'development';
  const appId = isDev ? DEV_ID : PROD_ID;

  return {
    ...config,
    name: isDev ? 'Timebox (Dev)' : 'Timebox',
    slug: 'timebox',
    ios: { ...config.ios, bundleIdentifier: appId },
    android: { ...config.android, package: appId },
  };
};
```

- [ ] **Step 5: 통과 확인**

Run: `npx jest __tests__/app.config.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 6: eas.json 실패 테스트 작성**

`__tests__/eas.config.test.ts`:

```ts
import { readFileSync } from 'fs';
import { join } from 'path';

const eas = JSON.parse(readFileSync(join(__dirname, '..', 'eas.json'), 'utf8'));

describe('eas.json', () => {
  it('lets EAS manage versionCode remotely', () => {
    expect(eas.cli.appVersionSource).toBe('remote');
  });

  it('builds the development profile as the dev variant with a dev client', () => {
    expect(eas.build.development).toMatchObject({
      developmentClient: true,
      distribution: 'internal',
      env: { APP_VARIANT: 'development' },
    });
  });

  it('never sets APP_VARIANT on preview or production', () => {
    expect(eas.build.preview.env?.APP_VARIANT).toBeUndefined();
    expect(eas.build.production.env?.APP_VARIANT).toBeUndefined();
  });

  it('builds preview as an internally distributed APK', () => {
    expect(eas.build.preview).toMatchObject({
      distribution: 'internal',
      android: { buildType: 'apk' },
    });
  });

  it('builds production as an auto-incremented AAB', () => {
    expect(eas.build.production.autoIncrement).toBe(true);
    expect(eas.build.production.android?.buildType ?? 'app-bundle').toBe('app-bundle');
  });

  it('submits production to the internal track with the gitignored key', () => {
    expect(eas.submit.production.android).toEqual({
      track: 'internal',
      serviceAccountKeyPath: './secrets/play-service-account.json',
    });
  });
});
```

- [ ] **Step 7: 실패 확인**

Run: `npx jest __tests__/eas.config.test.ts`
Expected: FAIL — `ENOENT: no such file or directory ... eas.json`

- [ ] **Step 8: `eas.json` 작성**

`eas --version`으로 설치된 EAS CLI 주 버전을 확인해 `cli.version`의 `<MAJOR>`에 넣는다(예: 16.x면 `">= 16.0.0"`).

```json
{
  "cli": {
    "version": ">= <MAJOR>.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": { "APP_VARIANT": "development" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "android": {
        "track": "internal",
        "serviceAccountKeyPath": "./secrets/play-service-account.json"
      }
    }
  }
}
```

- [ ] **Step 9: 통과와 전체 검사**

```bash
cd /Users/jun2/develop/time-boxing
npx jest __tests__/eas.config.test.ts
npm run check; echo "exit=$?"
APP_VARIANT=development npx expo config --type public | grep -E "name|package|bundleIdentifier"
npx expo config --type public | grep -E "name|package|bundleIdentifier"
```

Expected:
- eas 테스트 PASS (6 tests)
- `npm run check`가 watch 없이 끝나고 `exit=0`
- 첫 번째 config 출력: `Timebox (Dev)`, `com.ikjun.timebox.dev`
- 두 번째 config 출력: `Timebox`, `com.ikjun.timebox`

lint가 테스트 파일의 `describe`/`it`/`expect`를 정의되지 않은 전역으로 지적하면, `eslint.config.js`에 `__tests__/**` 대상 jest 전역을 추가하고(`globals` 패키지의 `globals.jest`) 다시 실행한다.

- [ ] **Step 10: Commit**

```bash
git add app.config.ts eas.json __tests__ package.json package-lock.json eslint.config.js
git commit -m "feat: split dev/prod app variants and add EAS build profiles"
```

---

### Task 3: 프로젝트 문서

**Files:**
- Move: `타임박싱 앱 (React Native) 계획 초안.md` → `docs/PLAN.md`
- Create: `CLAUDE.md`
- Create: `docs/decisions/0001-build-pipeline.md`
- Create: `docs/learnings.md`

**Interfaces:**
- Consumes: Task 2의 스크립트 이름(`npm run check`, `npm run android:dev`, `npm test`)
- Produces: 없음(문서)

- [ ] **Step 1: 초안 이동**

```bash
cd /Users/jun2/develop/time-boxing
git mv "타임박싱 앱 (React Native) 계획 초안.md" docs/PLAN.md 2>/dev/null || { mv "타임박싱 앱 (React Native) 계획 초안.md" docs/PLAN.md && git add docs/PLAN.md; }
```

(초안은 아직 추적되지 않은 파일일 수 있으므로 `mv` 후 `git add`로 대체한다.)

`docs/PLAN.md`의 "결정이 필요한 사항" 체크리스트에서 다음 세 줄을 체크하고 결정 내용을 덧붙인다:
- `- [x] 앱 이름과 번들 ID — 앱 이름 Timebox(가칭), 패키지 ID com.ikjun.timebox (dev: com.ikjun.timebox.dev)`
- `- [x] iOS와 Android를 동시에 출시할지, Android를 먼저 출시할지 — Android 먼저, iOS는 Phase 3 전`
- `- [x] 기본 블록 단위 (15분 추천) — 15분`

"배포 준비물과 비용" 섹션의 번들 ID 예시 줄을 `com.ikjun.timebox` / `com.ikjun.timebox.dev`로 바꾼다.

- [ ] **Step 2: `CLAUDE.md` 작성**

```markdown
# Timebox (React Native 학습 프로젝트)

## 목적
- RN 학습과 스토어 출시 경험이 목적이다. 전체 계획은 docs/PLAN.md, 단계별 설계는 docs/superpowers/specs/.
- 나는 웹 프론트엔드(Next.js) 2년차다. 웹과 다른 RN 개념은 웹과 비교해서 설명해줘.

## 작업 방식
- 한 번에 한 마일스톤만. 시작 전에 계획을 보여주고 확인받을 것.
- src/lib/time.ts, 드래그 로직, 알림 동기화는 내가 직접 쓴다. 힌트와 리뷰만 해줘.
- 설정, 보일러플레이트, 테스트 작성은 맡겨도 된다.
- 기술 선택을 바꿀 때는 docs/decisions/에 ADR을 남길 것.
- 마일스톤이 끝나면 docs/learnings.md에 배운 점을 한 단락 남긴다.

## 규칙
- 패키지 매니저: npm. Expo 관련 설치는 `npx expo install`로 (SDK 호환 버전).
- 패키지 ID: prod `com.ikjun.timebox`, dev `com.ikjun.timebox.dev`. `APP_VARIANT=development`일 때만 dev.
- Android 먼저 출시한다. iOS 빌드·TestFlight는 Phase 3 전에 추가.
- `android/`, `ios/`는 커밋하지 않는다. 네이티브 설정은 app.config.ts와 config plugin으로만.
- 스키마 변경은 반드시 drizzle 마이그레이션으로.
- 시간은 date('YYYY-MM-DD') + 분(0~1439)으로 저장한다.
- 커밋 전: `npm run check` (tsc, lint, jest) 통과.
- 키 파일(서비스 계정, keystore)은 secrets/ 또는 저장소 밖에 두고 절대 커밋하지 않는다.

## 명령어
- 개발 빌드 설치·실행: npm run android:dev
- 개발 서버만: npx expo start
- 검사: npm run check
- 테스트: npm test
- 출시 빌드: eas build --profile production --platform android
- 스토어 제출(내부 테스트 트랙): eas submit --profile production --platform android
```

- [ ] **Step 3: `docs/decisions/0001-build-pipeline.md` 작성**

```markdown
# ADR-0001: 빌드·배포 파이프라인 — 로컬 개발 빌드 + EAS 출시 빌드

- 상태: 채택
- 날짜: 2026-11-16

## 맥락

Expo Development Build를 실제 Android 기기에서 반복 확인하면서, 출시 빌드는 스토어 트랙까지 올려야 한다. EAS 무료 플랜은 월 빌드 횟수와 대기열 제한이 있고, 학습 목표에는 네이티브 빌드 과정 이해와 EAS 기반 출시 경험이 모두 들어 있다.

## 선택지

1. **하이브리드**: 개발은 `npx expo run:android`로 로컬 빌드, 출시는 EAS Build + EAS Submit.
2. **전부 EAS 클라우드**: dev 빌드도 EAS에서. 설정은 단순하지만 빌드마다 10~20분 대기, 무료 횟수 소모.
3. **전부 로컬(`eas build --local`)**: 비용·횟수 제한 없음. 서명과 빌드 환경 문제를 직접 해결해야 해서 출시 목표 대비 곁가지 학습이 많음.

## 결정

1번 하이브리드를 채택한다.

## 결과

- 개발 반복이 빠르고, prebuild로 생성되는 `android/` 구조를 직접 볼 수 있다.
- EAS 무료 빌드 횟수는 production 빌드에만 쓴다.
- 로컬 빌드 환경(JDK 17, Android SDK)을 유지해야 한다. 로컬 빌드가 막히면 EAS `development` 프로필로 우회한다.
- Android 서명 키는 EAS가 관리하므로 `eas credentials`로 백업본을 받아 저장소 밖에 보관해야 한다.
```

- [ ] **Step 4: `docs/learnings.md` 작성**

```markdown
# Learnings

마일스톤마다 배운 점을 한 단락씩 남긴다. 블로그와 포트폴리오 소재로 쓴다.

## Phase 0 · 셋업과 배포 파이프라인

(Phase 0 완료 게이트 통과 후 작성)
```

- [ ] **Step 5: 검증과 Commit**

```bash
cd /Users/jun2/develop/time-boxing
ls docs docs/decisions && test ! -e "타임박싱 앱 (React Native) 계획 초안.md" && echo "draft moved"
npm run check
git add CLAUDE.md docs/PLAN.md docs/decisions docs/learnings.md
git commit -m "docs: add CLAUDE.md, move plan to docs, record ADR-0001"
```

Expected: `draft moved`, `npm run check` 통과.

---

## Part B · 직접 하실 작업 (Claude는 단계별 안내)

각 항목을 진행할 때 Claude에게 "B-n 안내해줘"라고 요청하면 그 시점의 화면 기준으로 안내한다. 순서는 spec 5절과 같다.

- [ ] **B-1. Google Play 개발자 계정 등록** — 개인 계정, $25, 신분증·전화·Android 기기 인증. Part A와 병행. (spec #1)
- [ ] **B-2. Expo 계정 생성과 로그인** — expo.dev 가입 후 `eas login`, `eas whoami`로 확인. (spec #2)
- [ ] **B-3. EAS 프로젝트 연결** — Task 2 이후 `eas init`. 동적 config라 자동 기록이 안 되면 출력된 `extra.eas.projectId`와 `owner`를 `app.config.ts` 반환값에 추가하고 `npm run check` 후 커밋. (spec #5)
- [ ] **B-4. 폰에 dev 빌드 설치** — 개발자 옵션·USB 디버깅 켜기, `adb devices`로 확인, `npm run android:dev`. "Timebox (Dev)"가 뜨고 `app/index.tsx` 문구 수정이 바로 반영되는지 확인. (spec #7)
- [ ] **B-5. 첫 production AAB 빌드** — `eas build --profile production --platform android`. 서명 키 생성 질문에 "EAS가 생성"으로 답하고, 이후 `eas credentials`로 keystore 백업을 저장소 밖에 보관. (spec #8)
- [ ] **B-6. Play Console 앱 생성과 첫 수동 업로드** — 앱 만들기(기본 언어, 앱 이름 Timebox, 무료), 내부 테스트 트랙에 B-5의 AAB 업로드, 본인 이메일을 테스터로 등록, 옵트인 링크로 폰에 설치. (spec #9)
- [ ] **B-7. 서비스 계정 키 발급** — Google Cloud에서 서비스 계정 생성, JSON 키를 `secrets/play-service-account.json`에 저장, Play Console "사용자 및 권한"에서 이 계정에 앱 출시 권한 부여. `git check-ignore secrets/play-service-account.json`으로 무시되는지 재확인. (spec #10)
- [ ] **B-8. 자동 제출 경로 검증** — `app/index.tsx` 문구를 바꿔 커밋하고 `eas build --profile production --platform android --auto-submit`(또는 build 후 `eas submit --profile production --platform android`). 내부 테스트 트랙에 새 버전이 뜨고 폰에서 업데이트되는지 확인. (spec #11)
- [ ] **B-9. GitHub 원격 저장소 연결** — 비공개 저장소 생성 후 `git remote add origin ...`, `git push -u origin phase-0-setup`. (spec #12)

## Phase 0 완료 게이트 (spec 6절)

- [ ] `npm run check` 통과 (Task 2, 3)
- [ ] `npx expo config --type public`이 변형별로 이름·패키지 ID를 올바르게 출력 (Task 2 Step 9)
- [ ] 폰에 "Timebox (Dev)" 설치, Fast Refresh 동작 (B-4)
- [ ] 같은 폰에 Play 내부 테스트판 "Timebox"가 나란히 설치 (B-6)
- [ ] `eas submit`으로 올린 두 번째 빌드가 트랙에 반영되고 폰에서 업데이트 (B-8)
- [ ] ADR-0001 작성(Task 3), `docs/learnings.md`에 Phase 0 회고 한 단락 작성(게이트 통과 후 직접)
