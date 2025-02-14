import type {
  LogicalExpression,
  BinaryExpression,
  BinaryOperator,
  Expression,
  Literal,
} from 'estree'
import type { Rule } from 'eslint'

import { isLogicalExpression } from './is-logical-expression'
import { isBinaryExpression } from './is-binary-expression'
import { getNodeContent } from './get-node-content'
import { isBoolean } from './is-boolean'

/**
 * Toggles the leading exclamation mark in the given code string. If the
 * provided code string starts with an exclamation mark ('!'), this function
 * removes it and returns the resulting string. Otherwise, it prepends an
 * exclamation mark to the string and returns it.
 * @param {string} code - The code string to toggle the exclamation mark on.
 * @returns {string} The code string with the toggled exclamation mark.
 */
export let toggleCode = (code: string): string =>
  code.startsWith('!') ? code.replace(/^!/u, '') : `!${code}`

/**
 * Toggles the operator in a BinaryExpression. This function expects that the
 * operator is one of the supported ones: `===`, `!==`, `==`, or `!=`. It
 * returns the expression with the operator toggled, e.g. `a === b` becomes
 * `a !== b`.
 * @param {BinaryExpression} node - The binary expression ESLint node.
 * @param {Rule.RuleContext} context - The ESLint rule context.
 * @returns {string} The toggled expression.
 */
let toggleBinaryExpression = (
  node: BinaryExpression,
  context: Rule.RuleContext,
): string => {
  let left = getNodeContent(node.left, context).trim()
  let right = getNodeContent(node.right, context).trim()

  let notTransformableOperators: BinaryOperator[] = [
    '<<',
    '>>',
    '>>>',
    '+',
    '-',
    '*',
    '/',
    '%',
    '**',
    '|',
    '^',
    '&',
    'in',
    'instanceof',
  ]

  if (notTransformableOperators.includes(node.operator)) {
    return `!(${left} ${node.operator} ${right})`
  }

  let operatorMap: Record<string, BinaryOperator> = {
    '===': '!==',
    '!==': '===',
    '==': '!=',
    '!=': '==',
    '<': '>=',
    '>': '<=',
    '<=': '>',
    '>=': '<',
  }
  let toggledOperator = operatorMap[node.operator]
  return `${left} ${toggledOperator} ${right}`
}

let toggleLogicalExpression = (
  node: LogicalExpression,
  context: Rule.RuleContext,
): string => {
  let content = `(${getNodeContent(node, context).trim()})`
  return toggleCode(content)
}

/**
 * Toggles the negation of the given expression. If the expression starts with
 * a '!', this function removes the leading '!' and returns the rest of the
 * expression. Otherwise, it prepends a '!' to the expression. This function
 * does not assume that the given expression is necessarily a UnaryExpression;
 * it simply toggles the presence of a leading '!' in the source text.
 * @param {Expression} node - The ESLint expression node.
 * @param {Rule.RuleContext} context - The ESLint rule context.
 * @returns {string} The expression with toggled negation.
 */
export let toggleUnaryExpression = (
  node: Expression,
  context: Rule.RuleContext,
): string => {
  let content = getNodeContent(node, context).trim()
  return toggleCode(content)
}

/**
 * Toggles a boolean literal. If the literal's value is boolean, returns the
 * toggled boolean literal as a string: `true` becomes `"false"` and `false`
 * becomes `"true"`.
 * @param {Literal} node - The ESLint literal node.
 * @returns {string} The toggled boolean literal.
 */
let toggleBooleanLiteral = (node: Literal): string =>
  node.value ? 'false' : 'true'

/**
 * Toggles the negation of the given expression. The function applies the
 * following strategies in order:
 * 1. If the expression is a BinaryExpression with a supported operator (`===`,
 * `!==`, `==`, or `!=`),
 * it returns the expression with the operator toggled.
 * 2. If the expression is a boolean literal, it returns the toggled boolean
 * literal.
 * 3. If the expression is a UnaryExpression (i.e. already negated), it returns
 * the expression without the leading '!'.
 * 4. Otherwise, it returns the expression with a '!' prepended.
 * @param {Expression} node - The expression node to toggle negation on.
 * @param {Rule.RuleContext} context - The ESLint rule context.
 * @returns {string} The toggled expression.
 */
export let toggleNegation = (
  node: Expression,
  context: Rule.RuleContext,
): string => {
  let toggleStrategies: {
    transformer(node: Expression, context: Rule.RuleContext): string
    predicate(node: Expression): boolean
  }[] = [
    {
      transformer: toggleBinaryExpression,
      predicate: isBinaryExpression,
    },
    {
      transformer: toggleBooleanLiteral,
      predicate: isBoolean,
    },
    {
      transformer: toggleLogicalExpression,
      predicate: isLogicalExpression,
    },
  ]

  for (let { transformer, predicate } of toggleStrategies) {
    if (predicate(node)) {
      return transformer(node, context)
    }
  }

  return toggleUnaryExpression(node, context)
}
