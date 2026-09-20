import type { Rule } from 'eslint'

import { createNegatedExpressionListener } from '../utils/create-negated-expression-listener'
import { repository as repo } from '../package.json'
import { isPureGroup } from '../utils/is-pure-group'

interface Options {
  /**
   * Whether to transform negated disjunctions that mix `&&` and `||` without
   * grouping parentheses.
   */
  enforceForMixedOperators?: boolean
}

export default {
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
  create: context => {
    let [{ enforceForMixedOperators = false } = {}] = context.options as [
      Options?,
    ]

    return {
      UnaryExpression: createNegatedExpressionListener({
        isApplicable: node =>
          enforceForMixedOperators || isPureGroup(node, context),
        messageId: 'convertNegatedDisjunction',
        expressionType: 'disjunction',
        context,
      }),
    }
  },
} satisfies Rule.RuleModule
