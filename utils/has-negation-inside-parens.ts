import type { Node } from 'estree'
import type { Rule } from 'eslint'

import { findOutermostParenthesizedNode } from './find-outermost-parenthesized-node'
import { hasNegationOperator } from './has-negation-operator'
import { isLogicalExpression } from './is-logical-expression'
import { isUnaryExpression } from './is-unary-expression'

/**
 * Checks if there is a negation (`!`) inside the outermost parentheses of a
 * given negated expression. This is useful for determining if De Morgan's laws
 * can be applied without changing the logic.
 *
 * @param node - The starting node, assumed to be of the form `!(...)`.
 * @param context - The ESLint rule context, used to access source code.
 * @returns True if there is a negation (`!`) inside the parentheses.
 */
export function hasNegationInsideParens(
  node: Node,
  context: Rule.RuleContext,
): boolean {
  let sourceCode = context.sourceCode.getText(node)
  let outermostNode = findOutermostParenthesizedNode(node, sourceCode)

  if (!isUnaryExpression(outermostNode)) {
    return false
  }

  return hasNegationInside(outermostNode.argument)
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
  if (
    isUnaryExpression(node) &&
    node.operator === '!' &&
    isUnaryExpression(node.argument) &&
    node.argument.operator === '!'
  ) {
    return hasNegationInside(node.argument.argument)
  }

  if (hasNegationOperator(node)) {
    return true
  }

  if (isLogicalExpression(node)) {
    return hasNegationInside(node.left) || hasNegationInside(node.right)
  }

  return false
}
