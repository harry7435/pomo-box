# 타임박싱 앱 (React Native) 계획 초안

Nov 16, 2026 · @CHO IK JUN

## 개요

하루를 15\~30분 블록으로 나눠 계획하고, 하루가 끝나면 계획과 실제를 비교해 회고하는 타임박싱 앱을 React Native(Expo)로 만든다. 일론 머스크의 5분 단위 일정 관리에서 착안했지만, 기본 블록은 15분으로 하고 설정에서 바꿀 수 있게 한다.

**목적**

- RN 앱을 기획부터 스토어 출시, 업데이트 운영까지 한 사이클 끝까지 경험한다.
- 웹과 다른 RN 고유 영역(제스처·애니메이션, 로컬 DB, 알림, 네이티브 빌드)을 직접 다뤄본다.
- 포트폴리오에서 웹(To Find Crew·가계부), 풀스택(lotto-time)과 겹치지 않는 모바일 축을 맡는다.

**성공 기준**

- iOS App Store와 Google Play에 정식 출시된다.
- 출시 후 OTA 업데이트와 스토어 업데이트를 각각 1회 이상 배포한다.
- 본인이 2주 이상 매일 실사용한다.
- 면접에서 설명할 기술적 의사결정 3가지 이상이 문서로 남는다(저장소 선택, 드래그 구현, 알림 동기화 등).

## 기능 범위

MVP는 서버 없이 기기 안에서만 동작하고, 서버와 네이티브 코드는 출시 후에 붙인다.

| 기능 | 단계 | 배우는 것 |
| --- | --- | --- |
| 블록 만들기·수정·삭제 (제목, 시작·종료 시간, 카테고리) | MVP | 폼, 바텀시트, SQLite CRUD |
| 세로 타임라인에 하루 블록 표시, 현재 시간 표시선 | MVP | 절대 위치 레이아웃, 스크롤 |
| 블록 상태 체크 (완료 / 부분 / 건너뜀) | MVP | 상태 관리, 낙관적 업데이트  |
| 날짜 이동 (어제·내일, 날짜 선택) | MVP | 날짜 처리, 라우트 파라미터 |
| 블록 시작 전 로컬 알림 | MVP | expo-notifications, 권한 요청 UX |
| 드래그로 블록 이동·길이 조절 (블록 단위로 스냅) | 확장 | Gesture Handler, Reanimated |
| 하루 회고 (완료율, 한 줄 메모, 만족도) | 확장 | 집계 쿼리 |
| 주간 통계 (카테고리별 시간) | 확장 | 차트 라이브러리 |
| 템플릿 (평일 루틴을 하루에 불러오기) | 확장 | 데이터 복제, 트랜잭션 |
| 로그인과 클라우드 동기화 | 도전 | Firebase Auth·Firestore, 로컬 데이터 마이그레이션 |
| 홈 위젯 (지금·다음 블록) | 도전 | 네이티브 코드, config plugin |
| 잠금 화면에 진행 중 블록 표시 (iOS Live Activity) | 도전 | Swift, Expo Modules API |

제외하는 것: 다른 사람과 일정 공유, 구글 캘린더 연동, 반복 일정 규칙(RRULE). 범위가 커져서 출시가 밀리는 주범들이다.

## 기술 스택

Expo 최신 SDK를 기반으로, 이미 익숙한 TypeScript·Zustand·Tailwind 감각은 살리고 RN 고유 영역에 학습 시간을 쓴다. 버전은 프로젝트 생성 시점의 최신 안정 버전으로 고정한다.

| 영역 | 선택 | 이유 |
| --- | --- | --- |
| 프레임워크 | Expo (Development Build) | 네이티브 모듈을 붙일 수 있고, EAS로 빌드·배포까지 한 흐름으로 연결됨 |
| 언어 | TypeScript (strict) | 기존 스택 |
| 라우팅 | Expo Router | 파일 기반 라우팅이라 Next.js App Router와 비교하며 배울 수 있음 |
| 스타일 | NativeWind | Tailwind 문법 그대로 사용. 단, StyleSheet와의 차이는 따로 익힌다 |
| 로컬 DB | expo-sqlite + Drizzle ORM | 날짜·시간 범위 쿼리와 집계가 필요해서 키-값 저장소보다 적합. 마이그레이션 관리 가능 |
| 가벼운 설정값 | MMKV 또는 AsyncStorage | 블록 단위, 테마 등 |
| UI 상태 | Zustand | 기존 스택. 선택된 날짜, 편집 중인 블록 등 |
| 제스처·애니메이션 | react-native-gesture-handler + Reanimated | 드래그·리사이즈를 UI 스레드에서 처리 |
| 바텀시트 | @gorhom/bottom-sheet | 블록 편집 UI |
| 날짜 | date-fns | 트리 셰이킹, 불변 API |
| 알림 | expo-notifications | 로컬 알림 예약 |
| 테스트 | Jest + React Native Testing Library, Maestro | 로직 단위 테스트 + E2E (Playwright 경험과 비교) |
| 빌드·배포 | EAS Build, EAS Submit, EAS Update | 스토어 제출, OTA 업데이트 |
| 크래시 추적 | Sentry (후에 Crashlytics로 교체 가능) | 출시 전 연동 |
| 서버 (도전 단계) | React Native Firebase (Auth, Firestore) | 무료 한도 내 운영, 오프라인 동기화 기본 제공 |

## 화면 구성

하단 탭 3개(오늘 / 기록 / 설정)에, 블록 편집과 회고는 모달로 띄운다. 입력은 타임라인의 빈 칸을 탭하거나 길게 눌러 시작한다.

| 화면 | 경로 (Expo Router) | 주요 동작 |
| --- | --- | --- |
| 오늘 (타임라인) | `app/(tabs)/index.tsx` | 세로 타임라인, 현재 시간으로 자동 스크롤, 빈 칸 탭으로 블록 추가, 블록 탭으로 완료 체크, 상단에서 날짜 이동 |
| 블록 편집 | 바텀시트 (오늘 화면 위) | 제목, 시작·종료 시간, 카테고리, 알림 여부, 삭제 |
| 하루 회고 | `app/review/[date].tsx` (모달) | 계획 대비 완료율, 건너뛴 블록 목록, 한 줄 메모, 만족도 1\~5 |
| 기록 | `app/(tabs)/history.tsx` | 월간 달력(날짜별 완료율 색), 주간 카테고리별 시간 |
| 설정 | `app/(tabs)/settings.tsx` | 블록 단위(5/15/30분), 하루 시작·종료 시간, 알림 미리 알림 시간, 카테고리 관리, 데이터 내보내기 |
| 카테고리 관리 | `app/settings/categories.tsx` | 이름·색상 추가·수정 |
| 온보딩 | `app/onboarding.tsx` | 첫 실행 시 블록 단위 선택, 알림 권한 설명 후 요청 |

디자인은 참고 앱 2\~3개(Structured, Tiimo 등 타임라인형 플래너)를 살펴본 뒤 직접 정한다.

## 데이터 모델

테이블은 4개로 시작한다. 시간은 날짜 문자열(`YYYY-MM-DD`)과 자정부터의 분(0\~1439)으로 나눠 저장해 타임존 문제와 하루 단위 조회를 단순하게 한다. id는 나중의 클라우드 동기화를 위해 처음부터 UUID로 한다.

```
categories
  id            text (uuid, PK)
  name          text
  color         text            -- 팩레트 키
  sort_order    integer
  created_at, updated_at

blocks
  id            text (uuid, PK)
  date          text            -- 'YYYY-MM-DD', 인덱스
  start_min     integer         -- 0~1439
  end_min       integer         -- start_min보다 큼
  title         text
  category_id   text (FK, nullable)
  status        text            -- planned | done | partial | skipped
  notify        integer (bool)
  notification_id text (nullable)  -- 예약된 로컬 알림 id
  memo          text (nullable)
  created_at, updated_at, deleted_at  -- 소프트 삭제 (동기화 대비)

daily_reviews
  date          text (PK)
  rating        integer (1~5)
  note          text
  created_at, updated_at

templates / template_blocks   -- 확장 단계에서 추가
```

- 같은 날 블록이 겹치는지는 DB 제약이 아니라 앱 로직에서 검사한다. 겹침을 허용할지는 결정 사항에 둔다.
- 자정을 넘는 블록(23:30\~00:30)은 MVP에서 막고, 하루 종료 시간 설정으로 대신한다.
- 스키마 변경은 반드시 Drizzle 마이그레이션으로만 한다. 출시 후에는 기존 사용자 데이터가 있기 때문이다.

## 폴더 구조

라우트(`app/`)는 얇게 두고, 기능별 코드는 `src/features/`에 모은다. 타임라인 계산처럼 순수 로직은 UI와 분리해 단위 테스트한다.

```
app/
  _layout.tsx              # 루트: DB 초기화, 테마, 알림 핸들러
  onboarding.tsx
  (tabs)/
    _layout.tsx
    index.tsx              # 오늘 타임라인
    history.tsx
    settings.tsx
  review/[date].tsx
  settings/categories.tsx
src/
  db/
    client.ts              # expo-sqlite + drizzle 연결
    schema.ts
    migrations/            # drizzle-kit이 생성
  features/
    timeline/              # Timeline, BlockView, NowIndicator, 드래그 로직
    blocks/                # 블록 CRUD 훅, 편집 바텀시트
    review/
    history/
    notifications/         # 예약·취소·재동기화
    settings/
  lib/
    time.ts                # 분 ↔ px 변환, 스냅, 겹침 검사 (테스트 대상)
    date.ts
  stores/                  # zustand
  components/ui/           # Button, Sheet 등 공통 UI
  theme/
.maestro/                  # E2E 시나리오
eas.json
app.config.ts              # dev / prod 환경 분리 (번들 ID 다르게)
CLAUDE.md
docs/decisions/            # 기술 의사결정 기록 (ADR)
```

## 단계별 로드맵

정식 출시까지 6\~7주를 잡는다. 핵심은 기능을 만들기 전에 Phase 0에서 배포 경로부터 뚫는 것이다. 주당 투입 시간에 따라 기간은 조정한다.

&#91;embedded content: 단계별 로드맵 · 5단계, 단계마다 게이트\]

각 단계는 게이트를 통과해야 다음으로 넘어간다. 구글 개인 계정은 프로덕션 출시 전에 비공개 테스트 기간 요건이 있으므로, Phase 1이 끝나면 바로 테스터를 모아 비공개 테스트를 시작한다.

### Phase 0 · 셋업과 배포 파이프라인

- [ ] Google Play·Apple 개발자 계정 등록
- [ ] `create-expo-app`으로 프로젝트 생성, TypeScript strict, ESLint 설정
- [ ] `app.config.ts`로 dev/prod 번들 ID 분리
- [ ] Development Build를 만들어 실제 기기에 설치
- [ ] 빈 앱을 TestFlight와 Play 내부 테스트 트랙에 업로드
- [ ] CLAUDE.md와 docs/PLAN.md 작성

### Phase 1 · MVP 코어

- [ ] expo-sqlite + Drizzle 연결, 스키마와 첫 마이그레이션
- [ ] 탭 네비게이션 (오늘 / 기록 / 설정)
- [ ] 세로 타임라인과 현재 시간 표시선
- [ ] 블록 추가·수정·삭제 바텀시트
- [ ] 완료·부분·건너뜀 상태 체크
- [ ] 날짜 이동
- [ ] 블록 시작 알림 예약·취소, 권한 요청
- [ ] `lib/time.ts` 단위 테스트
- [ ] 내부 테스트 트랙에 재배포

### Phase 2 · 인터랙션과 회고

- [ ] 길게 눌러 드래그 이동, 아래 끝을 끌어 길이 조절, 블록 단위 스냅
- [ ] 하루 회고 모달
- [ ] 기록 탭: 월간 달력과 완료율
- [ ] 온보딩, 다크 모드, 햄틱
- [ ] Maestro로 "블록 추가 → 체크 → 회고" 시나리오 작성

### Phase 3 · 정식 출시

- [ ] 앱 아이콘, 스플래시, 스토어 스크린샷
- [ ] 개인정보처리방침 페이지
- [ ] Sentry 연동
- [ ] 스토어 등록 정보 작성, 심사 제출, 리젝 대응
- [ ] 출시 후 EAS Update로 OTA 업데이트 1회

### Phase 4 · 도전 과제

- [ ] 템플릿과 주간 통계
- [ ] Firebase 로그인·동기화, 기존 로컬 데이터 이전
- [ ] 홈 위젯
- [ ] iOS Live Activity

## 기술적 난관과 대응

가장 어려운 두 가지는 타임라인 드래그와 알림 동기화다. 둘 다 해결 과정을 `docs/decisions/`에 남겨 면접 소재로 쓴다.

1. **드래그·리사이즈와 스냅**
   - 분↔px 변환과 스냅 계산은 Reanimated worklet(UI 스레드)에서 하고, 손을 뗄 때만 `runOnJS`로 DB에 저장한다.
   - 드래그 중 타임라인 ScrollView와 제스처가 충돌한다. 길게 눌러야 드래그가 시작되게 해서 스크롤과 구분한다.
   - 화면 끝에서 자동 스크롤은 확장 단계로 미룬다.
2. **알림 스케줄링**
   - 블록을 수정·삭제할 때마다 기존 알림을 취소하고 다시 예약한다. `notification_id`를 블록에 저장해 추적한다.
   - iOS는 한 앱이 예약해둘 수 있는 로컬 알림 개수에 제한(약 64개)이 있다. 오늘과 내일 블록만 예약하고, 앱을 열 때마다 다시 맞춘다.
   - 권한을 거부한 사용자에게는 설정 화면으로 가는 안내를 보여준다.
3. **시간과 날짜**
   - "오늘"은 기기의 현재 타임존 기준이다. 날짜 문자열과 분 단위 저장으로 UTC 변환 문제를 피한다.
   - 앱이 백그라운드에 있다가 자정을 넘겨 돌아오면 날짜를 갱신한다(AppState).
4. **타임라인 렌더링 성능**
   - 하루는 최대 수십 개 블록이라 가상화 리스트 대신 절대 위치 레이아웃을 쓴다. 드래그 중인 블록 외에는 리렌더되지 않게 memo를 적용한다.
5. **플랫폼 차이**
   - 시간 선택 UI, 햄틱, 알림 권한 흐름이 iOS와 Android에서 다르다. 각 단계 끝에 두 기기에서 모두 확인한다.
   - Android 13 이상은 알림 권한을 따로 요청해야 하고, 정확한 시각에 울리는 알림은 별도 권한이 필요할 수 있다. 실제 기기에서 지연 정도를 측정해본다.

## 배포 준비물과 비용

필수 비용은 스토어 계정비뿐이고, 나머지는 무료 한도 안에서 충분하다. 구글 개인 계정의 출시 전 테스트 요건 때문에 Android 계정을 먼저 만든다.

| 항목 | 비용 | 필요 시점 |
| --- | --- | --- |
| Google Play 개발자 계정 | 1회 $25 | Phase 0 (가장 먼저) |
| Apple Developer Program | 연 $99 | Phase 0\~1 (TestFlight 배포 전) |
| Expo 계정 (EAS) | 무료 플랜 | Phase 0. 빌드 횟수가 부족하면 로컬 빌드로 대체 |
| 개인정보처리방침 페이지 | 무료 (Notion, GitHub Pages, Vercel) | Phase 3 스토어 제출 전 |
| 앱 아이콘, 스플래시, 스토어 스크린샷 | 무료 (Figma) | Phase 3 |
| Sentry | 무료 플랜 | Phase 3 |
| Firebase | 무료 (Spark) | Phase 4. 사진 첨부가 없으면 유료 플랜 불필요 |

- 번들 ID는 한 번 정하면 바꿀 수 없다. 예: `dev.ikjun.timebox` (prod), `dev.ikjun.timebox.dev` (dev).
- Android 서명 키는 EAS가 관리하게 하되, 백업 본을 따로 보관한다.
- 스토어의 데이터 안전(개인정보) 설문은 "수집 없음"으로 시작하고, Sentry·Firebase를 붙일 때 갱신한다.

## Claude Code 진행 가이드

학습이 목적이므로, Claude Code에는 코드 생성보다 설명과 리뷰를 맡기고 핵심 로직은 직접 작성한다. 이 문서를 Markdown으로 내보내 `docs/PLAN.md`에 두고, 아래 내용을 `CLAUDE.md`로 시작한다.

```markdown
# Timebox (React Native 학습 프로젝트)

## 목적
- RN 학습과 스토어 출시 경험이 목적이다. 전체 계획은 docs/PLAN.md.
- 나는 웹 프론트엔드(Next.js) 2년차다. 웹과 다른 RN 개념은 웹과 비교해서 설명해줘.

## 작업 방식
- 한 번에 한 마일스톤만. 시작 전에 계획을 보여주고 확인받을 것.
- src/lib/time.ts, 드래그 로직, 알림 동기화는 내가 직접 쓴다. 힌트와 리뷰만 해줘.
- 설정, 보일러플레이트, 테스트 작성은 맡겨도 된다.
- 기술 선택을 바꿀 때는 docs/decisions/에 ADR을 남길 것.

## 규칙
- 패키지 매니저: pnpm. 설치는 `npx expo install`로 (SDK 호환 버전).
- 스키마 변경은 반드시 drizzle 마이그레이션으로.
- 시간은 date('YYYY-MM-DD') + 분(0~1439)으로 저장한다.
- 커밋 전: tsc, lint, jest 통과.

## 명령어
- 개발: npx expo start
- 테스트: pnpm test / maestro test .maestro
- 빌드: eas build --profile development|preview|production
```

**세션 운영 팁**

- 세션 하나에 마일스톤 하나. 예: "Phase 1의 블록 CRUD만 진행하자. 먼저 계획부터 보여줘."
- 막히면 답보다 원인을 물어본다. 예: "왜 드래그 중에 스크롤이 같이 움직이는지 설명해줘."
- 마일스톤을 끝낼 때마다 배운 점을 한 단락씩 남긴다(`docs/learnings.md`). 나중에 블로그와 포트폴리오의 소재가 된다.
- 시뮬레이터만 믿지 말고 실제 기기에서 확인한다. 알림과 햄틱은 실제 기기에서만 제대로 동작한다.

## 결정이 필요한 사항

Phase 0 시작 전에 앞의 세 가지는 정해야 한다. 나머지는 해당 단계에서 정해도 된다.

- [ ] 앱 이름과 번들 ID (스토어에서 이름 중복 여부도 확인)
- [ ] iOS와 Android를 동시에 출시할지, Android를 먼저 출시할지
- [ ] 기본 블록 단위 (15분 추천)
- [ ] 같은 시간에 블록이 겹치는 것을 허용할지 (MVP에서는 막는 쪽이 단순)
- [ ] 알림 기본값: 블록 시작 시점인지, 5분 전인지
- [ ] 스타일링을 NativeWind로 갈지, StyleSheet로 기본기를 먼저 익힐지
- [ ] Phase 4에서 클라우드 동기화(Firebase)와 홈 위젯 중 무엇을 먼저 할지
