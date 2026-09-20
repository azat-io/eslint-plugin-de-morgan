import { createRuleTester } from 'eslint-vitest-rule-tester'
import { describe, expect, it, vi } from 'vitest'

import { testerConfig } from '../helpers/tester-config'

describe('transform fallback', () => {
  it.each([
    {
      importRule: () => import('../../rules/no-negated-conjunction'),
      name: 'no-negated-conjunction',
      expressionType: 'conjunction',
      code: 'if (!(a && b)) {}',
    },
    {
      importRule: () => import('../../rules/no-negated-disjunction'),
      name: 'no-negated-disjunction',
      expressionType: 'disjunction',
      code: 'if (!(a || b)) {}',
    },
  ])(
    '$name should skip reporting when transform cannot produce a fix',
    async ({ expressionType, importRule, name, code }) => {
      vi.resetModules()

      let transformMock = vi.fn().mockReturnValue(null)

      vi.doMock('../../utils/transform', () => ({
        transform: transformMock,
      }))

      try {
        let { default: mockedRule } = await importRule()
        let { valid: validRule } = createRuleTester({
          ...testerConfig,
          name: `${name} transform fallback`,
          rule: mockedRule,
        })

        await validRule(code)

        expect(transformMock).toHaveBeenCalledWith(
          expect.objectContaining({ expressionType }),
        )
      } finally {
        vi.doUnmock('../../utils/transform')
        vi.resetModules()
      }
    },
  )
})
