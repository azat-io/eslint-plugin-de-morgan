import type { BinaryExpression, Node } from 'estree'

/**
 * Checks whether the given AST node is a BinaryExpression. This type guard
 * function verifies if the provided node is of type 'BinaryExpression'.
 *
 * @param {Node} node - The AST node to check.
 * @returns {node is BinaryExpression} True if the node is a BinaryExpression,
 *   false otherwise.
 */
export let isBinaryExpression = (node: Node): node is BinaryExpression =>
  node.type === 'BinaryExpression'
