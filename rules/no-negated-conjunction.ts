import type { Rule } from 'eslint'

import { createNegatedExpressionListener } from '../utils/create-negated-expression-listener'
import { repository as repo } from '../package.json'

export default {
  meta: {
    docs: {
      description:
        'Transforms the negation of a conjunction !(A && B) into the ' +
        'equivalent !A || !B according to De Morgan’s law',
      url: `https://github.com/${repo}/blob/main/docs/no-negated-conjunction.md`,
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
  create: context => ({
    UnaryExpression: createNegatedExpressionListener({
      messageId: 'convertNegatedConjunction',
      expressionType: 'conjunction',
      context,
    }),
  }),
} satisfies Rule.RuleModule
