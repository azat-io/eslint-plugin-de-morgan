import type { UnaryExpression, Node } from 'estree'

/**
 * Checks whether the given AST node is a UnaryExpression. This type guard
 * function verifies if the provided node is of type 'UnaryExpression'.
 *
 * @param {Node} node - The AST node to check.
 * @returns {node is UnaryExpression} True if the node is a UnaryExpression,
 *   false otherwise.
 */
export let isUnaryExpression = (node: Node): node is UnaryExpression =>
  node.type === 'UnaryExpression'
