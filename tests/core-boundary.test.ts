// @vitest-environment node
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const BOUNDARY_RULES = new Set(['no-restricted-imports', 'no-restricted-globals'])
const eslint = new ESLint()

async function boundaryRuleIds(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages
    .map((message) => message.ruleId)
    .filter((ruleId): ruleId is string => ruleId !== null && BOUNDARY_RULES.has(ruleId))
}

describe('src/core boundary', { timeout: 30_000 }, () => {
  it.each([
    ['react', "import 'react'\n"],
    ['react-dom/client', "import 'react-dom/client'\n"],
    ['dexie', "import 'dexie'\n"],
    ['firebase/firestore', "import 'firebase/firestore'\n"],
    ['@firebase/app', "import '@firebase/app'\n"],
  ])('rejects importing %s from core', async (_name, code) => {
    expect(await boundaryRuleIds(code, 'src/core/sample.ts')).toContain('no-restricted-imports')
  })

  it.each(['window', 'document', 'localStorage', 'sessionStorage', 'indexedDB', 'navigator'])(
    'rejects the browser global %s in core',
    async (name) => {
      const code = `export const value = ${name}\n`
      expect(await boundaryRuleIds(code, 'src/core/sample.ts')).toContain('no-restricted-globals')
    },
  )

  it('rejects relative imports that leave core from a top-level core file', async () => {
    const code = "import '../features/timeline'\n"
    expect(await boundaryRuleIds(code, 'src/core/sample.ts')).toContain('no-restricted-imports')
  })

  it('rejects relative imports that leave core from a core subfolder', async () => {
    const code = "import '../../features/timeline'\n"
    expect(await boundaryRuleIds(code, 'src/core/timer/sample.ts')).toContain('no-restricted-imports')
  })

  it('allows sibling imports inside core', async () => {
    const code = "import './types.ts'\n"
    expect(await boundaryRuleIds(code, 'src/core/sample.ts')).toEqual([])
  })

  it('allows a core subfolder to import from the core root', async () => {
    const code = "import '../types.ts'\n"
    expect(await boundaryRuleIds(code, 'src/core/timer/sample.ts')).toEqual([])
  })

  it('allows vitest imports in core tests', async () => {
    const code = "import { describe } from 'vitest'\nexport { describe }\n"
    expect(await boundaryRuleIds(code, 'src/core/sample.test.ts')).toEqual([])
  })

  it('does not restrict react or browser globals outside core', async () => {
    const code = "import 'react'\nexport const width = window.innerWidth\n"
    expect(await boundaryRuleIds(code, 'src/App.tsx')).toEqual([])
  })
})
