import type { UnaryExpression, Node } from 'estree'

import { createTestWithParameters } from './create-test-with-parameters'
import { isUnaryExpression } from './is-unary-expression'
import { hasOperator } from './has-operator'

/**
 * Checks whether the given expression is a UnaryExpression with operator '!'.
 *
 * @param node - The AST node to check.
 * @returns True if the node is a UnaryExpression with operator '!'.
 */
export function hasNegationOperator(node: Node): node is UnaryExpression {
  let test = createTestWithParameters(node as UnaryExpression)
  return test(isUnaryExpression, hasOperator('!'))
}
