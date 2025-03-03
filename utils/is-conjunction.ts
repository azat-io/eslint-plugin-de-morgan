import type { LogicalExpression, Node } from 'estree'

import { createTestWithParameters } from './create-test-with-parameters'
import { isLogicalExpression } from './is-logical-expression'
import { hasOperator } from './has-operator'

/**
 * Checks whether the given AST node represents a conjunction (logical AND).
 *
 * @param {Node} node - The AST node to check.
 * @returns {node is LogicalExpression} True if the node is a LogicalExpression
 *   with operator `&&`.
 */
export let isConjunction = (node: Node): node is LogicalExpression => {
  let test = createTestWithParameters(node as LogicalExpression)
  return test(isLogicalExpression, hasOperator('&&'))
}
