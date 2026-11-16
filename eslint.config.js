import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const CORE_MESSAGE =
  'src/core는 웹과 앱이 공유하는 플랫폼 독립 영역입니다. React·브라우저·저장소 구현에 의존하지 마세요.'
const CORE_ESCAPE_MESSAGE = 'src/core 밖의 모듈을 import하지 마세요. 필요한 기능은 인터페이스로 주입받으세요.'

const corePackagePattern = {
  group: [
    'react',
    'react/*',
    'react-dom',
    'react-dom/*',
    'dexie',
    'dexie/*',
    'firebase',
    'firebase/*',
    '@firebase/*',
  ],
  message: CORE_MESSAGE,
}

const coreRestrictedGlobals = [
  'window',
  'document',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'navigator',
].map((name) => ({ name, message: CORE_MESSAGE }))

function coreBoundary(files, escapeGroup, extraRules = {}) {
  return {
    files,
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [corePackagePattern, { group: escapeGroup, message: CORE_ESCAPE_MESSAGE }] },
      ],
      'no-restricted-globals': ['error', ...coreRestrictedGlobals],
      ...extraRules,
    },
  }
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  // core 최상위 파일: core 밖으로 나가는 '../' 금지
  coreBoundary(['src/core/*.{ts,tsx}'], ['../*', '..']),
  // core 1단계 하위 폴더: core 밖으로 나가는 '../../' 금지
  coreBoundary(['src/core/*/*.{ts,tsx}'], ['../../*', '../..']),
  // core 2단계 이상 하위 폴더: 깊이 제한 위반으로 모든 파일을 에러 처리
  coreBoundary(['src/core/*/*/**/*.{ts,tsx}'], ['../../../*', '../../..'], {
    'no-restricted-syntax': [
      'error',
      { selector: 'Program', message: 'src/core 하위 폴더는 1단계까지만 둡니다(src/core/README.md 참고).' },
    ],
  }),
])
