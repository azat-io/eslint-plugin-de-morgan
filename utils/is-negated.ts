import type { UnaryExpression, Node } from 'estree'

import { hasNegationOperator } from './has-negation-operator'

type ParentedNode = { parent?: Node } & Node

/**
 * Checks whether the given AST node is a negated expression.
 *
 * @param node - The AST node to check.
 * @returns True if the node is a UnaryExpression with operator `!`.
 */
export function isNegated(node: ParentedNode): node is UnaryExpression {
  return (
    hasNegationOperator(node) &&
    !hasNegationOperator(node.argument) &&
    (!node.parent || !hasNegationOperator(node.parent))
  )
}
