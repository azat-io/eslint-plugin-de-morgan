import type { Node } from 'estree'
import type { Rule } from 'eslint'

import { findOutermostParenthesizedNode } from './find-outermost-parenthesized-node'
import { hasNegationOperator } from './has-negation-operator'
import { isLogicalExpression } from './is-logical-expression'
import { isUnaryExpression } from './is-unary-expression'
import { getNodeContent } from './get-node-content'

/**
 * Recursively checks if the given expression contains a "relevant" negation
 * (`!`). Double negations (`!!`) are ignored as they are typically used for
 * type coercion.
 * @param {Node} node - The AST expression node to check.
 * @returns {boolean} True if the expression contains a relevant `!` inside.
 */
let hasNegationInside = (node: Node): boolean => {
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

/**
 * Checks if there is a negation (`!`) inside the outermost parentheses of a
 * given negated expression. This is useful for determining if De Morgan's laws
 * can be applied without changing the logic.
 * @param {Node} node - The starting node, assumed to be of the form `!(...)`.
 * @param {Rule.RuleContext} context - The ESLint rule context, used to access
 * source code.
 * @returns {boolean} True if there is a negation (`!`) inside the parentheses.
 */
export let hasNegationInsideParens = (
  node: Node,
  context: Rule.RuleContext,
): boolean => {
  let sourceCode = getNodeContent(node, context)
  let outermostNode = findOutermostParenthesizedNode(node, sourceCode)

  if (!isUnaryExpression(outermostNode)) {
    return false
  }

  return hasNegationInside(outermostNode.argument)
}
