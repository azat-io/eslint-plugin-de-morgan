import type { LogicalExpression, Node } from 'estree'

import { isLogicalExpression } from './is-logical-expression'

/**
 * Checks whether the given AST node represents a disjunction (logical OR).
 * @param {Node} node - The AST node to check.
 * @returns {node is LogicalExpression} True if the node is a LogicalExpression
 * with operator `||`.
 */
export let isDisjunction = (node: Node): node is LogicalExpression =>
  isLogicalExpression(node) && node.operator === '||'
