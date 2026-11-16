# Pomobox

타임박싱 + 뽀모도로 서비스. 웹(React + Vite)을 먼저 출시하고, 로그인·서버 저장(W3) 뒤 React Native(Expo) 앱으로 확장한다.

## 목적
- 학습용 사이드 프로젝트. 전체 계획은 docs/PLAN.md, 단계별 설계는 docs/superpowers/specs/, 구현 계획은 docs/superpowers/plans/.
- 나는 웹 프론트엔드(Next.js) 2년차다. RN 단계에서는 웹과 다른 개념을 웹과 비교해서 설명해줘.

## 작업 방식
- 한 번에 한 마일스톤만. 시작 전에 계획을 보여주고 확인받을 것.
- src/core/time.ts, src/core/timer.ts, 드래그 로직, 게스트 데이터 이전, 알림 동기화는 내가 직접 쓴다. 힌트와 리뷰만 해줘.
- 설정, 보일러플레이트, 테스트, 문서는 맡겨도 된다.
- 기술 선택을 바꿀 때는 docs/decisions/에 ADR을 남길 것.
- 마일스톤이 끝나면 docs/learnings.md에 배운 점을 한 단락 남긴다.

## 규칙
- 패키지 매니저: npm.
- src/core는 플랫폼 독립 영역이다. React·브라우저 전역·Dexie·Firebase에 의존하지 않는다(ESLint가 강제, src/core/README.md 참고).
- 시간은 date('YYYY-MM-DD') + 분(0~1439)으로 저장한다. 타이머 구간처럼 실제 시각이 필요한 값만 epoch ms.
- id는 UUID, 모든 레코드에 updated_at과 deleted_at(소프트 삭제).
- 저장 스키마 변경은 버전 관리로만(웹 Dexie version(), 앱 Drizzle 마이그레이션).
- 커밋 전: npm run check (tsc, eslint, vitest) 통과.
- 커밋 메시지는 한글로 쓴다(접두어 feat:/fix:/chore:/docs:/test:는 유지). Co-Authored-By 트레일러는 붙이지 않는다.

## 명령어
- 개발 서버: npm run dev
- 검사: npm run check
- 테스트: npm test
- 빌드·미리보기: npm run build && npm run preview
