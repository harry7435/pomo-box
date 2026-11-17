# Pomobox

타임박싱 + 뽀모도로 서비스. npm workspaces 모노레포로 Android 앱(Expo, `apps/mobile`)을 먼저 출시하고, 웹(`apps/web`)은 보류 중이다. 웹·앱 공유 로직은 `packages/core`에 둔다. 학습용 사이드 프로젝트.

## 항상 따르는 규칙

@docs/guides/working-agreement.md
@docs/guides/conventions.md

## 필요할 때 읽는 문서

- [docs/PLAN.md](docs/PLAN.md): 전체 계획, 로드맵, 데이터 모델
- [docs/superpowers/specs/](docs/superpowers/specs/): 단계별 설계
- [docs/superpowers/plans/](docs/superpowers/plans/): 단계별 구현 계획
- [docs/decisions/](docs/decisions/): 기술 의사결정 기록(ADR)
- [docs/learnings.md](docs/learnings.md): 마일스톤별 회고
- [docs/guides/commands.md](docs/guides/commands.md): 개발 명령어
- [packages/core/README.md](packages/core/README.md): core 경계 규칙
