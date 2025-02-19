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
 * @param {ParentedNode} node - The AST node to check.
 * @param {Rule.RuleContext} [_context] - The ESLint rule context (technical
 * argument).
 * @returns {boolean} True if the expression is used in a boolean context.
 */
export let hasBooleanContext = (
  node: ParentedNode,
  _context: Rule.RuleContext,
): boolean =>
  node.parent
    ? isControlFlowBooleanContext(node.parent) ||
      isComparison(node.parent) ||
      isBooleanFunction(node.parent)
    : false

/**
 * Checks if the given node is part of a control flow structure that expects a
 * boolean value.
 *
 * These structures include:
 * - `if (expr) {...}`
 * - `while (expr) {...}`
 * - `for (; expr; ) {...}`
 * - `expr ? a : b` (ternary)
 * - Logical expressions (`&&`, `||`)
 * - Explicit coercion via `!!expr`
 * @param {Node} parent - The parent node in the AST.
 * @returns {boolean} True if the node is in a boolean context.
 */
let isControlFlowBooleanContext = (parent: Node): boolean =>
  booleanControlFlowNodes.has(parent.type)

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
 * Checks if the given node is part of a comparison operation.
 *
 * Supported operators: `===`, `!==`, `==`, `!=`, `<`, `>`, `<=`, `>=`.
 * @param {Node} parent - The parent node in the AST.
 * @returns {boolean} True if the node is a part of a binary comparison.
 */
let isComparison = (parent: Node): boolean =>
  isBinaryExpression(parent) && comparisonOperators.has(parent.operator)

let comparisonOperators = new Set<BinaryOperator>([
  '===',
  '!==',
  '==',
  '!=',
  '<=',
  '>=',
  '<',
  '>',
])

/**
 * Checks if the given node is passed to a function that explicitly converts it
 * to a boolean.
 * @param {Node} parent - The parent node in the AST.
 * @returns {boolean} True if the node is passed to `Boolean()`.
 */
let isBooleanFunction = (parent: Node): boolean =>
  parent.type === 'CallExpression' &&
  parent.callee.type === 'Identifier' &&
  parent.callee.name === 'Boolean'
