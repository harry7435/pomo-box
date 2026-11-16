# 작업 방식

Claude Code와 함께 작업할 때의 합의. 학습이 목적이므로 핵심 로직은 직접 쓰고, Claude는 설명·리뷰·보일러플레이트를 맡는다.

## 학습자 배경

- 웹 프론트엔드(Next.js) 2년차다. RN 단계에서는 웹과 다른 개념을 웹과 비교해서 설명한다.

## 진행 단위

- 한 번에 한 마일스톤만 진행한다. 시작 전에 계획을 보여주고 확인받는다.
- 마일스톤마다 spec(`docs/superpowers/specs/`) → 구현 계획(`docs/superpowers/plans/`) → 구현 순서를 따른다.

## 역할 분담

- 직접 작성(Claude는 힌트와 리뷰만): `src/core/time.ts`, `src/core/timer.ts`, 드래그 로직, 게스트 데이터 이전, 알림 동기화.
- 맡겨도 됨: 설정, 보일러플레이트, 테스트, 문서.

## 기록

- 기술 선택을 바꿀 때는 `docs/decisions/`에 ADR을 남긴다.
- 마일스톤이 끝나면 `docs/learnings.md`에 배운 점을 한 단락 남긴다.
