import type { Rule } from 'eslint'

import { flattenOperands } from '../utils/flatten-operands'
import { getNodeContent } from '../utils/get-node-content'
import { toggleNegation } from '../utils/toggle-negation'
import { isConjunction } from '../utils/is-conjunction'
import { toSingleLine } from '../utils/to-single-line'
import { joinOperands } from '../utils/join-operands'
import { isPureGroup } from '../utils/is-pure-group'
import { isNegated } from '../utils/is-negated'

export default {
  create: context => ({
    UnaryExpression: node => {
      if (
        isNegated(node) &&
        isConjunction(node.argument) &&
        isPureGroup(node, context)
      ) {
        let originalExpression = getNodeContent(node, context)
        let toggledOperands = flattenOperands({
          transformer: toggleNegation,
          expression: node.argument,
          predicate: isConjunction,
          context,
        })
        let shouldWrapInParens = isConjunction(node.parent)
        let fixedExpression = joinOperands(
          toggledOperands,
          shouldWrapInParens,
          '||',
        )

        context.report({
          data: {
            original: toSingleLine(originalExpression),
            fixed: toSingleLine(fixedExpression),
          },
          fix: fixer => fixer.replaceText(node, fixedExpression),
          messageId: 'convertNegatedConjunction',
          node,
        })
      }
    },
  }),
  meta: {
    docs: {
      description:
        'Transforms the negation of a conjunction !(A && B) into the ' +
        'equivalent !A || !B according to De Morgan’s law',
      url: 'https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/docs/no-negated-conjunction.md',
      category: 'Best Practices',
      recommended: true,
    },
    messages: {
      convertNegatedConjunction:
        'Replace negated conjunction `{{ original }}` with `{{ fixed }}`',
    },
    type: 'suggestion',
    fixable: 'code',
    schema: [],
  },
} satisfies Rule.RuleModule
