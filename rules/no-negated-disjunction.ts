import type { Rule } from 'eslint'

import { hasNegationInsideParentheses } from '../utils/has-negation-inside-parentheses'
import { hasBooleanContext } from '../utils/has-boolean-context'
import { flattenOperands } from '../utils/flatten-operands'
import { getNodeContent } from '../utils/get-node-content'
import { toggleNegation } from '../utils/toggle-negation'
import { isDisjunction } from '../utils/is-disjunction'
import { toSingleLine } from '../utils/to-single-line'
import { joinOperands } from '../utils/join-operands'
import { isPureGroup } from '../utils/is-pure-group'
import { isNegated } from '../utils/is-negated'

export default {
  create: context => ({
    UnaryExpression: node => {
      let isNegatedDisjunction = isNegated(node) && isDisjunction(node.argument)
      let hasPureOuterGroup = isPureGroup(node, context)
      let isSafeToFix =
        hasBooleanContext(node) || !hasNegationInsideParentheses(node, context)
      if (isNegatedDisjunction && hasPureOuterGroup && isSafeToFix) {
        let originalExpression = getNodeContent(node, context)
        let toggledOperands = flattenOperands({
          transformer: toggleNegation,
          expression: node.argument,
          predicate: isDisjunction,
          context,
        })
        let shouldWrapInParens = false
        let fixedExpression = joinOperands(
          toggledOperands,
          shouldWrapInParens,
          '&&',
        )

        context.report({
          data: {
            original: toSingleLine(originalExpression),
            fixed: toSingleLine(fixedExpression),
          },
          fix: fixer => fixer.replaceText(node, fixedExpression),
          messageId: 'convertNegatedDisjunction',
          node,
        })
      }
    },
  }),
  meta: {
    docs: {
      description:
        'Transforms the negation of a disjunction !(A || B) into the ' +
        'equivalent !A && !B according to De Morgan’s law',
      url: 'https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/docs/no-negated-disjunction.md',
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
