# Pomobox 계획

Nov 16, 2026 · @CHO IK JUN · 최초 초안("타임박싱 앱 (React Native) 계획 초안")을 웹 우선 로드맵으로 갱신

## 개요

하루를 15\~30분 블록으로 나눠 계획하고(타임박싱), 블록 안에서 집중 타이머로 실제 시간을 기록한 뒤(뽀모도로), 하루가 끝나면 계획과 실제를 비교해 회고하는 서비스다. 이름은 **Pomobox**(Pomodoro + Timebox).

웹을 먼저 출시해 바로 매일 쓰면서 기획을 검증하고, 로그인·서버 저장을 붙인 뒤, React Native(Expo) 앱으로 확장해 스토어에 출시한다. 기본 블록은 15분이고 설정에서 바꿀 수 있다.

**목적**

- 웹으로 빠르게 실사용을 시작해 기획을 검증한다.
- RN 앱을 스토어 출시, 업데이트 운영까지 한 사이클 끝까지 경험한다.
- 웹과 다른 RN 고유 영역(제스처·애니메이션, 로컬 DB, 알림, 네이티브 빌드)을 직접 다뤄본다.
- 같은 도메인을 웹(DOM)과 앱(RN)으로 구현하며, 플랫폼 독립 core 설계를 경험한다.

**성공 기준**

- 웹을 배포하고 본인이 2주 이상 매일 실사용한다.
- 로그인 시 게스트(기기) 데이터가 손실 없이 계정으로 이전된다.
- Google Play에 정식 출시한다(iOS App Store는 도전 단계).
- 앱 출시 후 OTA 업데이트와 스토어 업데이트를 각각 1회 이상 배포한다.
- 면접에서 설명할 기술적 의사결정 3가지 이상이 `docs/decisions/`에 남는다(웹 우선 스택, 저장소·동기화, 드래그, 타이머 정확도, 알림 동기화 등).

## 기능 범위

| 기능 | 단계 | 배우는 것 |
| --- | --- | --- |
| 블록 만들기·수정·삭제 (제목, 시작·종료 시간, 카테고리) | W1 | 폼, 저장소 인터페이스, IndexedDB(Dexie) |
| 세로 타임라인에 하루 블록 표시, 현재 시간 표시선 | W1 | 절대 위치 레이아웃, 스크롤 |
| 블록 상태 체크 (완료 / 부분 / 건너뜀) | W1 | 상태 관리, 낙관적 업데이트 |
| 날짜 이동 (어제·내일, 날짜 선택) | W1 | 날짜 처리, 라우트 파라미터 |
| 드래그로 블록 이동·길이 조절 (블록 단위 스냅) | W2 | dnd-kit, 포인터 이벤트 |
| 블록 집중 타이머 (블록 끝까지 / 집중·휴식 사이클) | W2 | 타임스탬프 기반 타이머, 백그라운드 탭 제약 |
| 하루 회고 (계획 대비 완료율·실제 집중 시간, 한 줄 메모, 만족도) | W2 | 집계 쿼리 |
| 기록 (월간 달력, 날짜별 완료율) | W2 | 날짜 범위 조회 |
| PWA (데스크톱 설치) | W2 | manifest, 서비스 워커 |
| 로그인과 서버 저장, 게스트 데이터 이전 | W3 | Firebase Auth·Firestore, 오프라인 캐시, 데이터 마이그레이션 |
| Android 앱 (위 기능 + 로컬 알림) | A1\~A3 | Expo, RN, gesture-handler·Reanimated, expo-notifications |
| 주간 통계, 템플릿 | 도전 | 차트, 트랜잭션 |
| iOS 출시, 홈 위젯, Live Activity(진행 중 타이머) | 도전 | 네이티브 코드, config plugin, Swift |

제외하는 것: 다른 사람과 일정 공유, 구글 캘린더 연동, 반복 일정 규칙(RRULE).

### 집중 타이머 규칙 (W2)

- 블록에서 "집중 시작"을 누르면 설정의 기본 모드로 바로 시작하고, 길게 누르면 모드·시간을 고른다.
- 모드: **블록 끝까지**(기본) / **집중·휴식 사이클**(프리셋 25/5, 50/10, 직접 입력). 사이클 모드는 30분 이상 블록에서만 고를 수 있고, 블록이 끝나면 마지막 사이클은 잘린다.
- 블록 시간 안에서 시작하면 남은 시간만큼, 블록 시간 밖에서 시작하면 블록 길이만큼 돌린다.
- 블록이 끝나면 "연장 / 종료"를 묻고, 연장한 시간도 기록한다.
- 일시정지는 구간을 닫고, 재개는 새 구간을 연다. 실제 집중 시간 = 구간 합.
- 끝나면 집중 비율로 상태를 추천한다(예: 80% 이상 "완료"). 결정은 사용자가 한다.
- 남은 시간은 `setInterval` 누적이 아니라 시작 시각과 현재 시각의 차이로 계산한다(백그라운드 탭 스로틀링 대비).

## 기술 스택

### 웹 (W0\~W3)

| 영역 | 선택 | 이유 |
| --- | --- | --- |
| 빌드 | Vite | 서버 기능이 필요 없는 SPA. Next.js보다 단순 |
| UI | React + TypeScript (strict) | 기존 스택. 빠른 실사용이 목표 |
| 라우팅 | React Router (W1에서 추가) | SPA 라우팅 |
| 스타일 | Tailwind CSS v4 | 기존 스택. 앱 단계에서 NativeWind로 클래스 문자열 상당 부분 재사용 |
| 게스트 저장소 | Dexie (IndexedDB) | 브라우저 내장 DB. 인덱스 범위 조회·트랜잭션 지원 |
| 서버 저장 (W3) | Firebase Auth + Firestore | 오프라인 캐시와 재연결 동기화를 기본 제공. 무료 한도 내 운영 |
| UI 상태 | Zustand | 기존 스택. 앱과 공유 가능 |
| 날짜 | date-fns | 트리 셰이킹, 불변 API |
| 드래그 | dnd-kit | 웹 표준적인 드래그 라이브러리 |
| 테스트 | Vitest + Testing Library, Playwright | 단위·컴포넌트 + E2E |
| 배포 | Vercel | GitHub 연동 자동 배포, PR 미리보기 |

### 앱 (A0\~)

| 영역 | 선택 | 이유 |
| --- | --- | --- |
| 프레임워크 | Expo (Development Build) | 네이티브 모듈, EAS로 빌드·배포까지 한 흐름 |
| 라우팅 | Expo Router | 파일 기반. React Router·Next.js와 비교 학습 |
| 스타일 | NativeWind | 웹 Tailwind 감각 유지. StyleSheet 차이는 따로 익힌다 |
| 게스트 저장소 | expo-sqlite + Drizzle | 날짜 범위 쿼리·집계, 마이그레이션 관리 |
| 서버 저장 | React Native Firebase | 웹과 같은 Firestore 데이터 |
| 제스처·애니메이션 | react-native-gesture-handler + Reanimated | UI 스레드에서 드래그 처리 |
| 알림 | expo-notifications | 블록 시작·타이머 종료 로컬 알림 |
| 테스트 | Jest + RNTL, Maestro | Playwright와 비교 |
| 빌드·배포 | EAS Build / Submit / Update | 스토어 제출, OTA |
| 크래시 추적 | Sentry | 출시 전 연동 |

### 공유 (`core`)

- 도메인 타입, 시간 계산(`time.ts`), 검증, 타이머 계산, Zustand store 로직, 저장소 인터페이스(`BlockRepository` 등).
- 웹 단계에서는 `src/core/`에 두고 ESLint로 `react`·`react-dom`·`dexie`·`firebase` import와 브라우저 전역(`window`, `document`, `localStorage`, `indexedDB`) 사용을 금지한다.
- A0에서 모노레포로 전환하며 `packages/core`로 옮긴다.

## 저장소와 로그인 흐름

1. 처음에는 로그인 없이 게스트 저장소(웹 Dexie, 앱 SQLite)에 저장한다.
2. 적절한 시점에 로그인을 권유한다("다른 기기에서도 보려면 로그인", 데이터가 일정량 쌓였을 때 등).
3. 첫 로그인 시 게스트 데이터를 서버에 한 번 업로드한다. UUID라 id 충돌이 없다.
4. 로그인 후에는 Firestore(오프라인 캐시 사용)가 기준 저장소다. 게스트 저장소는 로그아웃 상태 전용.
5. 화면은 저장소 인터페이스만 사용하고, 로그인 상태에 따라 구현을 바꿔 끼운다.

세부(이미 계정에 데이터가 있는 상태에서 게스트 데이터를 올리는 경우 등)는 W3 spec에서 정한다.

## 화면 구성 (웹)

| 화면 | 경로 | 주요 동작 |
| --- | --- | --- |
| 오늘 (타임라인) | `/`, `/day/:date` | 세로 타임라인, 현재 시간으로 자동 스크롤, 빈 칸 클릭으로 블록 추가, 블록 클릭으로 편집·상태 체크, 날짜 이동 |
| 블록 편집 | 오늘 화면 위 패널 | 제목, 시작·종료 시간, 카테고리, 삭제 |
| 집중 타이머 | 오늘 화면 위 오버레이 (W2) | 남은 시간, 모드, 일시정지·종료·연장 |
| 하루 회고 | `/review/:date` (W2) | 완료율, 실제 집중 시간, 건너뛴 블록, 한 줄 메모, 만족도 1\~5 |
| 기록 | `/history` (W2) | 월간 달력(날짜별 완료율 색) |
| 설정 | `/settings` | 블록 단위(5/15/30분), 하루 시작·종료 시간, 기본 타이머 모드·시간, 카테고리 관리 |

앱 화면은 A1에서 하단 탭(오늘 / 기록 / 설정) 구조로 옮긴다. 디자인은 타임라인형 플래너(Structured, Tiimo 등)를 살펴본 뒤 정한다.

## 데이터 모델

시간은 날짜 문자열(`YYYY-MM-DD`)과 자정부터의 분(0\~1439)으로 나눠 저장한다. 타이머 구간처럼 실제 시각이 필요한 값만 epoch ms로 저장한다. id는 처음부터 UUID, 모든 테이블에 `updated_at`과 소프트 삭제(`deleted_at`)를 둔다(동기화 대비).

```
categories
  id            text (uuid, PK)
  name          text
  color         text            -- 팔레트 키
  sort_order    integer
  created_at, updated_at, deleted_at

blocks
  id            text (uuid, PK)
  date          text            -- 'YYYY-MM-DD', 인덱스
  start_min     integer         -- 0~1439
  end_min       integer         -- start_min보다 큼
  title         text
  category_id   text (FK, nullable)
  status        text            -- planned | done | partial | skipped
  memo          text (nullable)
  created_at, updated_at, deleted_at

focus_sessions                  -- W2
  id            text (uuid, PK)
  block_id      text (FK)
  started_at    integer         -- epoch ms
  ended_at      integer         -- epoch ms
  created_at, updated_at, deleted_at

daily_reviews                   -- W2
  date          text (PK)
  rating        integer (1~5)
  note          text
  created_at, updated_at

settings (키-값)
  block_unit_min, day_start_min, day_end_min,
  timer_default_mode, timer_focus_min, timer_break_min
```

- 알림 관련 칼럼(`notify`, `notification_id`)은 앱 단계(A1)에서 추가한다.
- 같은 날 블록 겹침은 앱 로직에서 검사한다(허용 여부는 결정 사항).
- 자정을 넘는 블록은 막고, 하루 종료 시간 설정으로 대신한다.
- 스키마 변경은 버전 관리로만 한다(웹 Dexie `version()`, 앱 Drizzle 마이그레이션). 실사용 데이터가 있기 때문이다.

## 폴더 구조 (웹 단계)

```
src/
  core/                 # 플랫폼 독립. 앱과 공유 예정 (ESLint로 경계 강제)
    types.ts
    time.ts             # 분 ↔ px, 스냅, 겹침 검사 (직접 작성)
    timer.ts            # 남은 시간·사이클 계산 (W2)
    repository.ts       # 저장소 인터페이스
  data/
    dexie/              # 게스트 저장소 구현 (W1)
    firestore/          # 서버 저장소 구현 (W3)
  features/
    timeline/
    blocks/
    timer/              # W2
    review/             # W2
    history/            # W2
    settings/
  stores/               # zustand
  components/ui/
  routes/
e2e/                    # Playwright (W2)
docs/
  PLAN.md
  decisions/            # ADR
  learnings.md
  superpowers/specs, plans
```

## 단계별 로드맵

각 단계는 게이트를 통과해야 다음으로 넘어간다. 단계마다 spec → 구현 계획 → 구현 순서로 진행한다.

| 단계 | 내용 | 게이트 |
| --- | --- | --- |
| W0 · 웹 셋업 | Vite + React + TS strict, Tailwind, ESLint(core 경계), Vitest, Vercel 자동 배포 | Vercel URL에서 앱이 열림, `npm run check` 통과 |
| W1 · 웹 MVP | 저장소 인터페이스 + Dexie, 블록 CRUD, 타임라인·현재 시간선, 상태 체크, 날짜 이동 | 본인 매일 사용 시작 |
| W2 · 웹 확장 | 드래그, 집중 타이머, 하루 회고, 기록, PWA, Playwright E2E | 2주 연속 실사용 |
| W3 · 로그인·서버 저장 | Firebase Auth, Firestore, 게스트 데이터 이전, 로그인 권유 UX | 다른 브라우저에서 로그인하면 같은 데이터 |
| A0 · 앱 셋업 | 모노레포 전환(`packages/core`), Expo, Android 파이프라인 | 폰에 dev 빌드, Play 내부 테스트 업로드 |
| A1 · 앱 MVP | core 재사용, RN UI, 로그인 연동, 블록 알림 | 폰에서 매일 사용 |
| A2 · 앱 인터랙션 | 드래그(gesture-handler), 타이머·알림, 회고, Maestro | 비공개 테스트 시작(12명·14일) |
| A3 · 앱 출시 | 아이콘·스크린샷, 개인정보처리방침, Sentry, 심사, OTA 1회 | Play 정식 출시 |
| 도전 | iOS, 홈 위젯, Live Activity, 주간 통계, 템플릿 | — |

- Google 개인 개발자 계정은 프로덕션 출시 전에 테스터 12명 이상이 14일 연속 참여하는 비공개 테스트가 필요하다. A1 동안 Android 사용자 지인 명단(15명 정도)을 미리 만든다.
- A0 준비 문서: `docs/superpowers/specs/2026-11-16-phase0-setup-design.md`, `docs/superpowers/plans/2026-11-16-phase0-setup.md` (보류 중, 패키지 ID·경로 갱신 필요).

## 기술적 난관과 대응

1. **드래그·리사이즈와 스냅**: 웹은 dnd-kit, 앱은 gesture-handler + Reanimated worklet. 스냅 계산은 core의 `time.ts`를 공유한다. 앱에서는 길게 눌러야 드래그가 시작되게 해 스크롤과 구분한다.
2. **타이머 정확도**: 백그라운드 탭은 타이머가 느려지므로 타임스탬프 차이로 계산한다. 종료 알림은 웹에서 탭이 열려 있을 때만 확실하고, 앱에서는 로컬 알림으로 예약한다.
3. **게스트 → 계정 이전**: 첫 로그인 업로드의 원자성, 중복 업로드 방지, 이미 데이터가 있는 계정과의 병합 정책.
4. **알림 스케줄링 (앱)**: 블록 수정·삭제마다 재예약, iOS 예약 개수 제한(약 64개) 대비 오늘·내일만 예약, 권한 거부 시 안내.
5. **시간과 날짜**: "오늘"은 기기 타임존 기준. 자정을 넘겨 돌아오면 날짜 갱신(웹 `visibilitychange`, 앱 AppState).
6. **플랫폼 차이**: 시간 선택 UI, 햅틱, 알림 권한 흐름. 단계 끝마다 실제 기기에서 확인한다.

## 배포 준비물과 비용

| 항목 | 비용 | 필요 시점 |
| --- | --- | --- |
| Vercel | 무료 (Hobby) | W0 |
| GitHub | 무료 | W0 |
| Firebase | 무료 (Spark) | W3 |
| Google Play 개발자 계정 | 1회 $25 | A0 전 (본인 인증 대기 시간 고려) |
| Expo 계정 (EAS) | 무료 플랜 | A0 |
| 개인정보처리방침 페이지 | 무료 (웹에 페이지 추가) | W3(로그인 도입 시), A3 |
| Sentry | 무료 플랜 | A3 |
| Apple Developer Program | 연 $99 | 도전 단계 (iOS) |

- 패키지 ID: prod `com.ikjun.pomobox`, dev `com.ikjun.pomobox.dev`. 한 번 정하면 바꿀 수 없다.
- 로그인을 도입하면 개인정보를 수집하게 되므로, W3에서 개인정보처리방침을 먼저 게시한다.

## Claude Code 진행 가이드

학습이 목적이므로 Claude Code에는 설명과 리뷰를 맡기고 핵심 로직은 직접 작성한다. 운영 규칙은 저장소 루트 `CLAUDE.md`에 둔다.

- 세션 하나에 마일스톤 하나. 시작 전에 계획을 보여주고 확인받는다.
- 직접 작성: `core/time.ts`, `core/timer.ts`, 드래그 로직, 게스트 데이터 이전, 알림 동기화.
- 맡겨도 됨: 설정, 보일러플레이트, 테스트, 문서.
- 막히면 답보다 원인을 묻는다.
- 마일스톤을 끝낼 때마다 `docs/learnings.md`에 배운 점을 한 단락 남긴다.

## 결정 기록

- [x] 서비스 이름: **Pomobox**
- [x] 출시 순서: 웹 → (로그인) → Android → iOS(도전)
- [x] 웹 스택: React + Vite (Expo 웹 대신, 빠른 실사용 우선)
- [x] 저장: 게스트 로컬 저장 → 로그인 시 Firestore로 이전, 로그인은 W3(앱 전)
- [x] 뽀모도로 결합: 블록 집중 타이머 + 집중·휴식 사이클 설정
- [x] 기본 블록 단위: 15분
- [x] 앱 패키지 ID: `com.ikjun.pomobox`

## 결정이 필요한 사항

- [ ] 같은 시간에 블록이 겹치는 것을 허용할지 (W1, 막는 쪽이 단순)
- [ ] 계정에 이미 데이터가 있을 때 게스트 데이터 병합 정책 (W3)
- [ ] 알림 기본값: 블록 시작 시점 / 5분 전 (A1)
