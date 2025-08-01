import type { Literal } from 'estree'
import type { Node } from 'estree'

/**
 * Checks whether the given AST node is a boolean literal. This function
 * verifies that the node is a literal and its value is of boolean type.
 *
 * @param node - The AST node to check.
 * @returns True if the node is a literal with a boolean value.
 */
export function isBoolean(node: Node): node is { value: boolean } & Literal {
  return node.type === 'Literal' && typeof node.value === 'boolean'
}
