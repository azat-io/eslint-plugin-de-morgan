import type { Expression } from 'estree'
import type { Literal } from 'estree'

/**
 * Checks whether the given AST node is a boolean literal. This function
 * verifies that the node is a literal and its value is of boolean type.
 * @param {Expression} node - The AST node to check.
 * @returns {node is Literal & { value: boolean }} True if the node is a literal
 * with a boolean value.
 */
export let isBoolean = (
  node: Expression,
): node is { value: boolean } & Literal =>
  node.type === 'Literal' && typeof node.value === 'boolean'
