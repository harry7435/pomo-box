import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

const CORE_MESSAGE =
  '@pomobox/core는 웹과 앱이 공유하는 플랫폼 독립 영역입니다. React·React Native·Expo·브라우저·저장소 구현에 의존하지 마세요.'
const CORE_ESCAPE_MESSAGE = 'src 밖의 모듈을 import하지 마세요. 필요한 기능은 인터페이스로 주입받으세요.'

const corePackagePattern = {
  group: [
    'react',
    'react/*',
    'react-dom',
    'react-dom/*',
    'react-native',
    'react-native/*',
    'expo',
    'expo/*',
    'expo-*',
    '@expo/*',
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
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },
  // src 최상위 파일: src 밖으로 나가는 '../' 금지
  coreBoundary(['src/*.{ts,tsx}'], ['../*', '..']),
  // src 1단계 하위 폴더: src 밖으로 나가는 '../../' 금지
  coreBoundary(['src/*/*.{ts,tsx}'], ['../../*', '../..']),
  // src 2단계 이상: 폴더 깊이 자체를 금지
  coreBoundary(['src/*/*/**/*.{ts,tsx}'], ['../../../*', '../../..'], {
    'no-restricted-syntax': [
      'error',
      { selector: 'Program', message: '@pomobox/core의 src 하위 폴더는 1단계까지만 둡니다(README 참고).' },
    ],
  }),
])
