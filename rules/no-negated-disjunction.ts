import type { Rule } from 'eslint'

import { createTestWithParameters } from '../utils/create-test-with-parameters'
import { hasNegationInsideParens } from '../utils/has-negation-inside-parens'
import { isInTruthinessContext } from '../utils/is-in-truthiness-context'
import { getStatementSafeFix } from '../utils/get-statement-safe-fix'
import { needsParentParens } from '../utils/needs-parent-parens'
import { hasBooleanContext } from '../utils/has-boolean-context'
import { applyToProperty } from '../utils/apply-to-property'
import { isDisjunction } from '../utils/is-disjunction'
import { sanitizeCode } from '../utils/sanitize-code'
import { isPureGroup } from '../utils/is-pure-group'
import { repository as repo } from '../package.json'
import { isNegated } from '../utils/is-negated'
import { transform } from '../utils/transform'
import { not } from '../utils/not'
import { or } from '../utils/or'

interface Options {
  /**
   * Whether to transform negated disjunctions that mix `&&` and `||` without
   * grouping parentheses.
   */
  enforceForMixedOperators?: boolean
}

export default {
  create: context => {
    let [{ enforceForMixedOperators = false } = {}] = context.options as [
      Options?,
    ]

    return {
      UnaryExpression: node => {
        let test = createTestWithParameters(node, context)
        if (
          test(
            isNegated,
            applyToProperty('argument', isDisjunction),
            or(hasBooleanContext, not(hasNegationInsideParens)),
          ) &&
          (enforceForMixedOperators || isPureGroup(node, context))
        ) {
          let shouldWrapInParens = needsParentParens(node, '&&')
          let canStripNegation = isInTruthinessContext(node)

          let fixedExpression = transform({
            expressionType: 'disjunction',
            shouldWrapInParens,
            canStripNegation,
            context,
            node,
          })

          if (fixedExpression) {
            let safeFix = getStatementSafeFix({
              fix: fixedExpression,
              context,
              node,
            })
            let originalExpression = context.sourceCode.getText(node)

            context.report({
              data: {
                fixed: sanitizeCode(safeFix ?? fixedExpression),
                original: sanitizeCode(originalExpression),
              },
              fix: fixer =>
                safeFix === null ? null : fixer.replaceText(node, safeFix),
              messageId: 'convertNegatedDisjunction',
              node,
            })
          }
        }
      },
    }
  },
  meta: {
    schema: [
      {
        properties: {
          enforceForMixedOperators: {
            description:
              'Transform negated disjunctions that mix `&&` and `||` ' +
              'without grouping parentheses',
            type: 'boolean',
          },
        },
        additionalProperties: false,
        type: 'object',
      },
    ],
    docs: {
      description:
        'Transforms the negation of a disjunction !(A || B) into the ' +
        'equivalent !A && !B according to De Morgan’s law',
      url: `https://github.com/${repo}/blob/main/docs/no-negated-disjunction.md`,
      recommended: true,
    },
    messages: {
      convertNegatedDisjunction:
        'Replace negated disjunction `{{ original }}` with `{{ fixed }}`',
    },
    defaultOptions: [{ enforceForMixedOperators: false }],
    type: 'suggestion',
    fixable: 'code',
  },
} satisfies Rule.RuleModule
