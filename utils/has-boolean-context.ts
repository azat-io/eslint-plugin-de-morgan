import type { BinaryOperator, Node } from 'estree'
import type { Rule } from 'eslint'

import { isBinaryExpression } from './is-binary-expression'

type ParentedNode = { parent?: Node } & Node

/**
 * Determines whether a given expression is used in a boolean context.
 *
 * Boolean contexts include conditions in control flow statements (`if`,
 * `while`, `for`), logical expressions (`&&`, `||`), explicit boolean coercions
 * (`!!`, `Boolean(expr)`), and comparison operations (`===`, `!==`, `<`, `>`).
 *
 * @param {ParentedNode} node - The AST node to check.
 * @param {Rule.RuleContext} [_context] - The ESLint rule context (technical
 *   argument).
 * @returns {boolean} True if the expression is used in a boolean context.
 */
export function hasBooleanContext(
  node: ParentedNode,
  _context: Rule.RuleContext,
): boolean {
  return node.parent
    ? isControlFlowBooleanContext(node.parent) ||
        isBooleanOperation(node.parent) ||
        isBooleanFunction(node.parent)
    : false
}

/**
 * Checks if the given node is part of a control flow structure that expects a
 * boolean value.
 *
 * These structures include:
 *
 * - `if (expr) {...}`
 * - `while (expr) {...}`
 * - `for (; expr; ) {...}`
 * - `expr ? a : b` (ternary)
 * - Logical expressions (`&&`, `||`)
 * - Explicit coercion via `!!expr`
 *
 * @param {Node} parent - The parent node in the AST.
 * @returns {boolean} True if the node is in a boolean context.
 */
function isControlFlowBooleanContext(parent: Node): boolean {
  return booleanControlFlowNodes.has(parent.type)
}

let booleanControlFlowNodes = new Set<Node['type']>([
  'ConditionalExpression',
  'LogicalExpression',
  'DoWhileStatement',
  'UnaryExpression',
  'WhileStatement',
  'ForStatement',
  'IfStatement',
])

/**
 * Checks if the given node is part of an operation that always returns a
 * boolean value. Supported operators:
 *
 * - Comparison: `===`, `!==`, `==`, `!=`, `<`, `>`, `<=`, `>=`
 * - Type checking: `in`, `instanceof`
 *
 * @param {Node} parent - The parent node in the AST.
 * @returns {boolean} True if the node is a part of a binary comparison.
 */
function isBooleanOperation(parent: Node): boolean {
  return isBinaryExpression(parent) && booleanOperators.has(parent.operator)
}

let booleanOperators = new Set<BinaryOperator>([
  'instanceof',
  '===',
  '!==',
  '==',
  '!=',
  '<=',
  '>=',
  'in',
  '<',
  '>',
])

/**
 * Checks if the given node is passed to a function that explicitly converts it
 * to a boolean.
 *
 * @param {Node} parent - The parent node in the AST.
 * @returns {boolean} True if the node is passed to `Boolean()`.
 */
function isBooleanFunction(parent: Node): boolean {
  return (
    parent.type === 'CallExpression' &&
    parent.callee.type === 'Identifier' &&
    parent.callee.name === 'Boolean'
  )
}
