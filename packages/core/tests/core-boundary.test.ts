// @vitest-environment node
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const BOUNDARY_RULES = new Set(['no-restricted-imports', 'no-restricted-globals', 'no-restricted-syntax'])
const packageRoot = fileURLToPath(new URL('..', import.meta.url))
const eslint = new ESLint({ cwd: packageRoot })

async function boundaryRuleIds(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages
    .map((message) => message.ruleId)
    .filter((ruleId): ruleId is string => ruleId !== null && BOUNDARY_RULES.has(ruleId))
}

describe('@pomobox/core boundary', { timeout: 30_000 }, () => {
  it.each([
    ['react', "import 'react'\n"],
    ['react-dom/client', "import 'react-dom/client'\n"],
    ['dexie', "import 'dexie'\n"],
    ['firebase/firestore', "import 'firebase/firestore'\n"],
    ['@firebase/app', "import '@firebase/app'\n"],
    ['react-native', "import 'react-native'\n"],
    ['expo', "import 'expo'\n"],
    ['expo-sqlite', "import 'expo-sqlite'\n"],
    ['@expo/vector-icons', "import '@expo/vector-icons'\n"],
  ])('rejects importing %s from core', async (_name, code) => {
    expect(await boundaryRuleIds(code, 'src/sample.ts')).toContain('no-restricted-imports')
  })

  it.each(['window', 'document', 'localStorage', 'sessionStorage', 'indexedDB', 'navigator'])(
    'rejects the browser global %s in core',
    async (name) => {
      const code = `export const value = ${name}\n`
      expect(await boundaryRuleIds(code, 'src/sample.ts')).toContain('no-restricted-globals')
    },
  )

  it('rejects relative imports that leave src from a top-level file', async () => {
    expect(await boundaryRuleIds("import '../tests/helper'\n", 'src/sample.ts')).toContain('no-restricted-imports')
  })

  it('rejects relative imports that leave src from a subfolder', async () => {
    expect(await boundaryRuleIds("import '../../tests/helper'\n", 'src/timer/sample.ts')).toContain(
      'no-restricted-imports',
    )
  })

  it('rejects importing a package from a subfolder', async () => {
    expect(await boundaryRuleIds("import 'react'\n", 'src/timer/sample.ts')).toContain('no-restricted-imports')
  })

  it('rejects bare parent import from a top-level file', async () => {
    expect(await boundaryRuleIds("import '..'\n", 'src/sample.ts')).toContain('no-restricted-imports')
  })

  it('rejects bare grandparent import from a subfolder', async () => {
    expect(await boundaryRuleIds("import '../..'\n", 'src/timer/sample.ts')).toContain('no-restricted-imports')
  })

  it('rejects any file two folders deep', async () => {
    expect(await boundaryRuleIds('export const value = 1\n', 'src/timer/deep/sample.ts')).toContain(
      'no-restricted-syntax',
    )
  })

  it('rejects packages two folders deep', async () => {
    expect(await boundaryRuleIds("import 'react'\n", 'src/timer/deep/sample.ts')).toContain('no-restricted-imports')
  })

  it('allows sibling imports inside src', async () => {
    expect(await boundaryRuleIds("import './types'\n", 'src/sample.ts')).toEqual([])
  })

  it('allows a subfolder to import from the src root', async () => {
    expect(await boundaryRuleIds("import '../types'\n", 'src/timer/sample.ts')).toEqual([])
  })

  it('allows vitest imports in core tests inside src', async () => {
    const code = "import { describe } from 'vitest'\nexport { describe }\n"
    expect(await boundaryRuleIds(code, 'src/sample.test.ts')).toEqual([])
  })

  it('does not apply src rules to files outside src', async () => {
    const code = "import { ESLint } from 'eslint'\nexport { ESLint }\n"
    expect(await boundaryRuleIds(code, 'tests/sample.test.ts')).toEqual([])
  })
})
