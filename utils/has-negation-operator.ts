import type { UnaryExpression, Node } from 'estree'

import { isUnaryExpression } from './is-unary-expression'

/**
 * Checks whether the given expression is a UnaryExpression with operator '!'.
 * @param {Node} node - The AST node to check.
 * @returns {boolean} True if the node is a UnaryExpression with
 * operator '!'
 */
export let hasNegationOperator = (node: Node): node is UnaryExpression =>
  isUnaryExpression(node) && node.operator === '!'
