import type { BinaryExpression, Node } from 'estree'

/**
 * Checks whether the given AST node is a BinaryExpression. This type guard
 * function verifies if the provided node is of type 'BinaryExpression'.
 *
 * @param node - The AST node to check.
 * @returns True if the node is a BinaryExpression, false otherwise.
 */
export function isBinaryExpression(node: Node): node is BinaryExpression {
  return node.type === 'BinaryExpression'
}
