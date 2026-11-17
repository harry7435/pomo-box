> **대체됨 (2026-11-17):** 이 문서는 `docs/superpowers/specs/2026-11-17-a0-app-setup-design.md`와 `docs/superpowers/plans/2026-11-17-a0-app-setup.md`로 대체되었다. 기록용으로만 남긴다.

# Phase 0 · 셋업과 배포 파이프라인 설계

- 작성일: 2026-11-16
- 상위 계획: `타임박싱 앱 (React Native) 계획 초안.md` (Phase 0에서 `docs/PLAN.md`로 이동)
- 범위: 초안 로드맵의 Phase 0. Phase 1 이후는 각각 별도 spec으로 작성한다.

## 1. 목표

기능을 만들기 전에 "코드 수정 → 실제 기기 확인 → 스토어 트랙 배포" 경로를 끝까지 뚫는다. Phase 0이 끝나면 빈 앱이 개발 빌드와 Play 내부 테스트 빌드로 같은 폰에 나란히 설치되어 있어야 한다.

## 2. 확정된 결정

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 출시 순서 | Android 먼저. iOS는 Phase 3 전에 추가 | 테스트 기기가 Android 폰이고, Google 개인 계정의 비공개 테스트 요건을 일찍 채워야 함 |
| 패키지 ID | prod `com.ikjun.timebox`, dev `com.ikjun.timebox.dev` | 가장 흔한 역도메인 형식. 접미사 `.dev`로 두 빌드를 한 기기에 같이 설치 |
| iOS bundleIdentifier | Android와 동일한 값으로 지금 정해 둠 | 출시 후 변경 불가. 빌드는 Phase 3 전에 진행 |
| 빌드 파이프라인 | 하이브리드: 개발은 로컬 `npx expo run:android`, 출시는 EAS Build + EAS Submit | 개발 반복은 빠르게, 출시 흐름은 EAS로 경험. 무료 플랜 빌드 횟수 절약 |
| 패키지 매니저 | npm. 의존성 설치는 `npx expo install` | Expo 기본값이라 호환성 문제가 가장 적음 |
| 기본 블록 단위 | 15분 | 초안 추천값. 구현은 Phase 1 |

## 3. 저장소 구조

- Expo 앱을 저장소 루트에 둔다(모노레포 아님).
- `create-expo-app`의 최신 안정 SDK 기본 템플릿으로 시작하고, 예제 화면은 최소한으로 정리한다. 초안의 `src/` 폴더 구조는 Phase 1에서 채운다.
- Phase 0이 끝났을 때 추가·변경되는 파일:

```
app/                      # 템플릿 기본 라우트 (정리만)
app.config.ts             # dev/prod 분리
eas.json
tsconfig.json             # strict
eslint.config.js          # eslint-config-expo
jest 설정 (package.json 또는 jest.config.js, jest-expo 프리셋)
__tests__/ 또는 src/**/*.test.ts  # 샘플 테스트 1개
.gitignore                # 서비스 계정 키, android/, ios/ 포함
CLAUDE.md
docs/
  PLAN.md                 # 초안 md 이동
  decisions/0001-build-pipeline.md
  learnings.md
```

- `android/`, `ios/`는 prebuild 산출물로 보고 커밋하지 않는다(Continuous Native Generation). 네이티브 설정은 `app.config.ts`와 config plugin으로만 바꾼다.

## 4. 설정 상세

### 4.1 `app.config.ts`

`process.env.APP_VARIANT === 'development'`이면 dev 값, 아니면 prod 값을 쓴다.

| 키 | development | production |
| --- | --- | --- |
| `name` | `Timebox (Dev)` | `Timebox` |
| `android.package` | `com.ikjun.timebox.dev` | `com.ikjun.timebox` |
| `ios.bundleIdentifier` | `com.ikjun.timebox.dev` | `com.ikjun.timebox` |

- `slug`, `scheme`, EAS `projectId`는 두 환경에서 공유한다.
- 로컬 개발 빌드는 `APP_VARIANT=development npx expo run:android`로 실행하며, `package.json` 스크립트(`android:dev`)로 감싼다.

### 4.2 `eas.json`

| 프로필 | 용도 | 핵심 설정 |
| --- | --- | --- |
| `development` | 예비용 클라우드 dev 빌드 | `developmentClient: true`, `distribution: internal`, `env.APP_VARIANT=development` |
| `preview` | 테스터에게 직접 배포하는 APK | `distribution: internal`, `android.buildType: apk` |
| `production` | 스토어 제출용 AAB | `autoIncrement: true` |

- `cli.appVersionSource: "remote"`로 `versionCode`를 EAS가 관리한다.
- `submit.production.android`: `track: "internal"`, `serviceAccountKeyPath`는 저장소 밖이나 gitignore된 경로로 둔다.
- Android 서명 키는 EAS가 생성·관리하고, `eas credentials`로 백업본을 받아 저장소 밖에 보관한다.

### 4.3 코드 품질 도구

- TypeScript `strict: true`.
- ESLint: `npx expo lint`로 생성되는 `eslint-config-expo` 설정.
- Jest: `jest-expo` 프리셋과 샘플 테스트 1개. React Native Testing Library는 Phase 1에서 필요할 때 추가한다.
- `npm run check` = `tsc --noEmit && npm run lint && npm test`. 커밋 전 이 스크립트가 통과해야 한다.
- Prettier, git hook(husky), CI는 넣지 않는다.

### 4.4 문서

- `CLAUDE.md`: 초안의 "Claude Code 진행 가이드" 내용을 기반으로 하되 다음을 반영한다.
  - 패키지 매니저 npm, 설치는 `npx expo install`
  - 커밋 전 `npm run check`
  - 패키지 ID와 Android 먼저 출시
  - 명령어: `npm run android:dev`, `npm test`, `eas build --profile <profile> --platform android`, `eas submit --platform android`
- `docs/PLAN.md`: 초안 md를 이동한다(`git mv`). 이후 계획 변경은 이 파일에 반영한다.
- `docs/decisions/0001-build-pipeline.md`: 맥락, 선택지(A 하이브리드 / B 전부 EAS / C 전부 로컬), 결정, 결과를 ADR 형식으로 남긴다.
- `docs/learnings.md`: 마일스톤별 회고를 쌓는 파일. 제목과 Phase 0 섹션만 만든다.

## 5. 작업 순서와 담당

"위임"은 Claude Code(서브에이전트)가 수행하고, "직접"은 사용자가 수행하며 Claude는 단계별 안내를 제공한다.

| # | 작업 | 담당 | 선행 조건 |
| --- | --- | --- | --- |
| 1 | Google Play 개발자 계정 등록 ($25, 본인 인증) | 직접 | 없음. 승인 대기 시간이 있어 가장 먼저 시작 |
| 2 | Expo 계정 생성, `eas login` | 직접 | 없음 |
| 3 | 프로젝트 생성, TS strict, ESLint, Jest, `npm run check` | 위임 | 없음 |
| 4 | `app.config.ts`, `eas.json` 작성 | 위임 | 3 |
| 5 | `eas init`으로 EAS projectId 연결 | 직접 | 2, 4 |
| 6 | `CLAUDE.md`, `docs/PLAN.md`, ADR-0001, `docs/learnings.md` | 위임 | 3 |
| 7 | 폰 USB 디버깅 활성화, `npm run android:dev`로 dev 빌드 설치 | 직접 | 4 |
| 8 | `eas build --profile production --platform android`로 AAB 생성 | 직접 | 5 |
| 9 | Play Console 앱 생성, 첫 AAB를 내부 테스트 트랙에 수동 업로드, 본인을 테스터로 등록 | 직접 | 1, 8 |
| 10 | Google Cloud 서비스 계정 생성, 키(JSON) 발급, Play Console 권한 부여 | 직접 | 9 |
| 11 | 화면 문구 등을 조금 바꾸고 `eas build` → `eas submit`으로 두 번째 업로드 | 직접 | 10 |
| 12 | GitHub 원격 저장소 생성·연결 | 직접 | 3 |

- Play Console은 API 제출 전에 첫 AAB를 웹에서 수동 업로드해야 하므로, 9를 건너뛰고 `eas submit`을 쓸 수 없다.
- 3~7은 Play 계정 승인을 기다리는 동안 진행한다.

## 6. 완료 게이트

모두 통과해야 Phase 1로 넘어간다.

- [ ] `npm run check` 통과
- [ ] `npx expo config --type public`에서 `APP_VARIANT` 유무에 따라 이름·패키지 ID가 4.1 표대로 나온다
- [ ] 폰에 "Timebox (Dev)"가 설치되고, 코드 수정이 Fast Refresh로 바로 반영된다
- [ ] 같은 폰에 Play 내부 테스트로 받은 "Timebox"가 dev 앱과 나란히 설치된다
- [ ] `eas submit`으로 올린 두 번째 빌드가 내부 테스트 트랙에 반영되고, 폰에서 업데이트된다
- [ ] ADR-0001 작성, `docs/learnings.md`에 Phase 0 회고 한 단락 작성

## 7. 범위 밖

- Apple Developer 계정, iOS 빌드, TestFlight (Phase 3 전)
- 비공개 테스트 테스터 모집 (Phase 1 종료 직후)
- CI(GitHub Actions), Sentry, Prettier, git hook
- 초안의 `src/` 폴더 구조, DB, 상태 관리 등 Phase 1 항목

## 8. 위험과 대응

| 위험 | 대응 |
| --- | --- |
| Play 계정 본인 인증·승인 지연 | 1번을 가장 먼저 시작하고, 3~7을 병행 |
| EAS 무료 플랜 빌드 횟수 부족 | 개발 빌드는 로컬에서만 만들고, EAS는 production 빌드에만 사용. 부족하면 `eas build --local` |
| 서비스 계정 키·서명 키 유출 또는 분실 | 키 파일은 gitignore하고 저장소 밖에 백업 |
| 로컬 Android 빌드 환경 문제(JDK, SDK 버전) | 현재 JDK 17과 Android SDK가 설치되어 있음. 실패하면 오류를 `learnings.md`에 기록하고, 막히면 EAS development 프로필로 우회 |
