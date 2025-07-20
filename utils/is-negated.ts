import type { UnaryExpression, Node } from 'estree'

import { hasNegationOperator } from './has-negation-operator'

type ParentedNode = { parent?: Node } & Node

/**
 * Checks whether the given AST node is a negated expression.
 *
 * @param {Node} node - The AST node to check.
 * @returns {node is UnaryExpression} True if the node is a UnaryExpression with
 *   operator `!`.
 */
export function isNegated(node: ParentedNode): node is UnaryExpression {
  return (
    hasNegationOperator(node) &&
    !hasNegationOperator(node.argument) &&
    (!node.parent || !hasNegationOperator(node.parent))
  )
}
