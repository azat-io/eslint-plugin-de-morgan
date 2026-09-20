import type { Node } from 'estree'
import type { Rule } from 'eslint'

import { hasNegationOperator } from './has-negation-operator'
import { isLogicalExpression } from './is-logical-expression'
import { isUnaryExpression } from './is-unary-expression'

/**
 * Checks if there is a negation (`!`) inside the parentheses of a given negated
 * expression. This is useful for determining if De Morgan's laws can be applied
 * without changing the logic.
 *
 * @param node - The starting node, assumed to be of the form `!(...)`.
 * @param [_context] - The ESLint rule context (technical argument).
 * @returns True if there is a negation (`!`) inside the parentheses.
 */
export function hasNegationInsideParens(
  node: Node,
  _context: Rule.RuleContext,
): boolean {
  return isUnaryExpression(node) && hasNegationInside(node.argument)
}

/**
 * Recursively checks if the given expression contains a "relevant" negation
 * (`!`). Double negations (`!!`) are ignored as they are typically used for
 * type coercion.
 *
 * @param node - The AST expression node to check.
 * @returns True if the expression contains a relevant `!` inside.
 */
function hasNegationInside(node: Node): boolean {
  let current = node

  while (
    isUnaryExpression(current) &&
    current.operator === '!' &&
    isUnaryExpression(current.argument) &&
    current.argument.operator === '!'
  ) {
    current = current.argument.argument
  }

  if (hasNegationOperator(current)) {
    return true
  }

  if (isLogicalExpression(current)) {
    return hasNegationInside(current.left) || hasNegationInside(current.right)
  }

  return false
}
