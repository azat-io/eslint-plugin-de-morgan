import type { RuleModule } from 'eslint-vitest-rule-tester'

import { RuleTester } from 'oxlint/plugins-dev'
import { it } from 'vitest'

/**
 * Builds a rule tester that runs the rule in Oxlint, which loads the plugin
 * through `jsPlugins` without ESLint. The tested source is parsed as an ES
 * module, and fixes are applied once, as in the shared ESLint tester
 * configuration.
 *
 * @example
 *
 * ```ts
 * buildOxlintRuleTester(rule).run('no-negated-conjunction', {
 *   invalid: [
 *     {
 *       errors: [{ messageId: 'convertNegatedConjunction' }],
 *       output: 'if (!a || !b) {}',
 *       code: 'if (!(a && b)) {}',
 *     },
 *   ],
 *   valid: ['if (!a) {}'],
 * })
 * ```
 *
 * @param rule - The rule module to test.
 * @returns An object with a `run` method that registers the test cases.
 */
export function buildOxlintRuleTester(rule: RuleModule): {
  run(name: string, tests: RuleTester.TestCases): void
} {
  RuleTester.it = it

  return {
    run: (name, tests) => {
      let ruleTester = new RuleTester({
        languageOptions: { sourceType: 'module' },
      })
      ruleTester.run(name, rule as Parameters<RuleTester['run']>[1], tests)
    },
  }
}
