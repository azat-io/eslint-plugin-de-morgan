import type { LogicalExpression, Node } from 'estree'

/**
 * Checks whether the given AST node is a isLogicalExpression. This type guard
 * function verifies if the provided node is of type 'isLogicalExpression'.
 *
 * @param {Node} node - The AST node to check.
 * @returns {node is isLogicalExpression} True if the node is a
 *   isLogicalExpression, false otherwise.
 */
export let isLogicalExpression = (node: Node): node is LogicalExpression =>
  node.type === 'LogicalExpression'
