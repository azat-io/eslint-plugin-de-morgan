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
import { parenthesize } from './parenthesize'
import { isBoolean } from './is-boolean'

/**
 * Toggles the negation of the given expression. The function applies the
 * following strategies in order:
 *
 * 1. If the expression is a `BinaryExpression` with a supported binary operator
 *    (`===`, `!==`, `==`, or `!=`), it returns the expression with the operator
 *    toggled.
 * 2. If the expression is a boolean literal, it returns the toggled boolean
 *    literal.
 * 3. If the expression is a `UnaryExpression` (i.e. Already negated), it will
 *    return the expression without the leading '!'.
 * 4. Otherwise, it returns the expression with a '!' prepended..
 *
 * @param node - The expression node to toggle negation on.
 * @param context - The ESLint rule context.
 * @returns The toggled expression.
 */
export function toggleNegation(
  node: Expression,
  context: Rule.RuleContext,
): string {
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

/**
 * Toggles the operator in a BinaryExpression. This function expects that the
 * operator is one of the supported ones: `===`, `!==`, `==`, or `!=`. It
 * returns the expression with the operator toggled, e.g. `a === b` becomes `a
 * !== b`.
 *
 * @param node - The binary expression ESLint node.
 * @param context - The ESLint rule context.
 * @returns The toggled expression.
 */
function toggleBinaryExpression(
  node: BinaryExpression,
  context: Rule.RuleContext,
): string {
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

function toggleLogicalExpression(
  node: LogicalExpression,
  context: Rule.RuleContext,
): string {
  let content = getNodeContent(node, context).trim()
  return toggleCode(parenthesize(content))
}

/**
 * Toggles the negation of the given expression. If the expression starts with a
 * '!', this function removes the leading '!' and returns the rest of the
 * expression. Otherwise, it prepends a '!' to the expression. This function
 * does not assume that the given expression is necessarily a UnaryExpression;
 * it simply toggles the presence of a leading '!' in the source text.
 *
 * @param node - The ESLint expression node.
 * @param context - The ESLint rule context.
 * @returns The expression with toggled negation.
 */
function toggleUnaryExpression(
  node: Expression,
  context: Rule.RuleContext,
): string {
  let content = getNodeContent(node, context).trim()
  return toggleCode(content)
}

/**
 * Toggles the leading exclamation mark in the given code string. If the
 * provided code string starts with an exclamation mark ('!'), this function
 * removes it and returns the resulting string. Otherwise, it prepends an
 * exclamation mark to the string and returns it.
 *
 * @param code - The code string to toggle the exclamation mark on.
 * @returns The code string with the toggled exclamation mark.
 */
function toggleCode(code: string): string {
  return code.startsWith('!') ? code.replace(/^!/u, '') : `!${code}`
}

/**
 * Toggles a boolean literal. If the literal's value is boolean, returns the
 * toggled boolean literal as a string: `true` becomes `"false"` and `false`
 * becomes `"true"`.
 *
 * @param node - The ESLint literal node.
 * @returns The toggled boolean literal.
 */
function toggleBooleanLiteral(node: Literal): string {
  return node.value ? 'false' : 'true'
}
