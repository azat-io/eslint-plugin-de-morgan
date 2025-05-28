import { defineConfig } from 'eslint-rule-benchmark'

export default defineConfig({
  tests: [
    {
      cases: [
        {
          testPath: './no-negated-conjunction/base-case.ts',
        },
        {
          testPath: './no-negated-conjunction/complex-case.ts',
        },
      ],
      rulePath: '../rules/no-negated-conjunction.ts',
      name: 'Rule: no-negated-conjunction',
      ruleId: 'no-negated-conjunction',
    },
    {
      cases: [
        {
          testPath: './no-negated-disjunction/base-case.ts',
        },
        {
          testPath: './no-negated-disjunction/complex-case.ts',
        },
      ],
      rulePath: '../rules/no-negated-disjunction.ts',
      name: 'Rule: no-negated-disjunction',
      ruleId: 'no-negated-disjunction',
    },
  ],
})
