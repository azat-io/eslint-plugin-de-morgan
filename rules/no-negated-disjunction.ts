import type { Rule } from 'eslint'

import { createTestWithParameters } from '../utils/create-test-with-parameters'
import { hasNegationInsideParens } from '../utils/has-negation-inside-parens'
import { hasBooleanContext } from '../utils/has-boolean-context'
import { applyToProperty } from '../utils/apply-to-property'
import { isDisjunction } from '../utils/is-disjunction'
import { sanitizeCode } from '../utils/sanitize-code'
import { isPureGroup } from '../utils/is-pure-group'
import { isNegated } from '../utils/is-negated'
import { transform } from '../utils/transform'
import { repository } from '../package.json'
import { not } from '../utils/not'
import { or } from '../utils/or'

export default {
  create: context => ({
    UnaryExpression: node => {
      let test = createTestWithParameters(node, context)
      if (
        test(
          isNegated,
          applyToProperty('argument', isDisjunction),
          isPureGroup,
          or(hasBooleanContext, not(hasNegationInsideParens)),
        )
      ) {
        let shouldWrapInParens = false

        let fixedExpression = transform({
          expressionType: 'disjunction',
          shouldWrapInParens,
          context,
          node,
        })

        if (fixedExpression) {
          let originalExpression = context.sourceCode.getText(node)

          context.report({
            data: {
              original: sanitizeCode(originalExpression),
              fixed: sanitizeCode(fixedExpression),
            },
            fix: fixer => fixer.replaceText(node, fixedExpression),
            messageId: 'convertNegatedDisjunction',
            node,
          })
        }
      }
    },
  }),
  meta: {
    docs: {
      description:
        'Transforms the negation of a disjunction !(A || B) into the ' +
        'equivalent !A && !B according to De Morgan’s law',
      url: `https://github.com/${repository}/blob/main/docs/no-negated-disjunction.md`,
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      convertNegatedDisjunction:
        'Replace negated disjunction `{{ original }}` with `{{ fixed }}`',
    },
    type: 'suggestion',
    fixable: 'code',
    schema: [],
  },
} satisfies Rule.RuleModule
