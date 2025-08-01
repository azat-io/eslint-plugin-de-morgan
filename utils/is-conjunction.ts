import type { LogicalExpression, Node } from 'estree'

import { createTestWithParameters } from './create-test-with-parameters'
import { isLogicalExpression } from './is-logical-expression'
import { hasOperator } from './has-operator'

/**
 * Checks whether the given AST node represents a conjunction (logical AND).
 *
 * @param node - The AST node to check.
 * @returns True if the node is a LogicalExpression with operator `&&`.
 */
export function isConjunction(node: Node): node is LogicalExpression {
  let test = createTestWithParameters(node as LogicalExpression)
  return test(isLogicalExpression, hasOperator('&&'))
}
