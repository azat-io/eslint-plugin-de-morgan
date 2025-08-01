import type { UnaryExpression, Node } from 'estree'

/**
 * Checks whether the given AST node is a UnaryExpression. This type guard
 * function verifies if the provided node is of type 'UnaryExpression'.
 *
 * @param node - The AST node to check.
 * @returns True if the node is a UnaryExpression, false otherwise.
 */
export function isUnaryExpression(node: Node): node is UnaryExpression {
  return node.type === 'UnaryExpression'
}
