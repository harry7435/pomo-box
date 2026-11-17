# 명령어

모든 명령은 저장소 루트에서 실행한다. 특정 워크스페이스만 실행할 때는 `-w <이름>`을 붙인다.

| 용도 | 명령 |
| --- | --- |
| 전체 검사 (모든 워크스페이스 tsc, lint, test) | `npm run check` |
| 전체 테스트 | `npm test` |
| core만 검사 | `npm run check -w @pomobox/core` |
| 웹 개발 서버 | `npm run dev -w @pomobox/web` |
| 웹 빌드 | `npm run build -w @pomobox/web` |
| 앱 개발 빌드 설치·실행 (Android 폰 연결) | `npm run android:dev -w @pomobox/mobile` |
| 앱 개발 서버만 | `npm start -w @pomobox/mobile` |
| 앱 Expo 의존성 설치 | `cd apps/mobile && npx expo install <패키지>` |
| 앱 출시 빌드 | `cd apps/mobile && eas build --profile production --platform android` |
| 앱 스토어 제출 (내부 테스트 트랙) | `cd apps/mobile && eas submit --profile production --platform android` |

- 앱의 `android/` 폴더는 생성물이다. dev(`android:dev`)와 prod 변형을 바꿔 로컬 빌드할 때는 `cd apps/mobile && npx expo prebuild --clean`으로 다시 생성한다.
