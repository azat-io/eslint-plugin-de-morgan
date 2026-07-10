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
 * When `canStripNegation` is false, an already negated expression keeps an
 * exact double negation (`!x` becomes `!!x`) instead of being stripped to the
 * bare operand. Stripping is only truthiness-preserving, so it is unsafe in
 * positions where the produced value itself is observable.
 *
 * @param node - The expression node to toggle negation on.
 * @param context - The ESLint rule context.
 * @param canStripNegation - Whether a leading '!' may be stripped from an
 *   already negated expression.
 * @returns The toggled expression.
 */
export function toggleNegation(
  node: Expression,
  context: Rule.RuleContext,
  canStripNegation = true,
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

  return toggleUnaryExpression(node, context, canStripNegation)
}

/**
 * Toggles the operator in a BinaryExpression. Only equality operators (`===`,
 * `!==`, `==`, and `!=`) are exact logical complements, so only they are
 * toggled, e.g. `a === b` becomes `a !== b`. The toggle replaces just the
 * operator token inside the node's original source text, so parentheses and
 * comments around the operands are preserved. Every other binary expression is
 * wrapped in `!(…)` instead — relational operators like `<` cannot be toggled
 * because both `a < b` and `a >= b` are false when an operand is NaN.
 *
 * @param node - The binary expression ESLint node.
 * @param context - The ESLint rule context.
 * @returns The toggled expression.
 */
function toggleBinaryExpression(
  node: BinaryExpression,
  context: Rule.RuleContext,
): string {
  let text = context.sourceCode.getText(node)

  let operatorMap: Partial<Record<BinaryOperator, BinaryOperator>> = {
    '===': '!==',
    '!==': '===',
    '==': '!=',
    '!=': '==',
  }

  let toggledOperator = operatorMap[node.operator]
  if (!toggledOperator) {
    return `!(${text})`
  }

  let operatorToken = context.sourceCode.getTokenAfter(node.left, {
    filter: token => token.value === node.operator,
  })
  if (!operatorToken || !node.range) {
    return `!(${text})`
  }

  let [nodeStart] = node.range
  let [tokenStart, tokenEnd] = operatorToken.range
  return (
    text.slice(0, tokenStart - nodeStart) +
    toggledOperator +
    text.slice(tokenEnd - nodeStart)
  )
}

/**
 * Toggles the negation of the given expression. If the expression starts with a
 * '!', this function removes the leading '!' and returns the rest of the
 * expression. Otherwise, it prepends a '!' to the expression. Expressions that
 * bind looser than the unary '!' operator (assignments, ternaries, sequences,
 * arrow functions, and `yield`) are wrapped in `!(…)` instead, since prepending
 * a bare '!' would re-associate them and change the meaning or produce invalid
 * code. When `canStripNegation` is false, a leading '!' is never stripped and
 * an exact double negation is emitted instead, so the result stays a strict
 * boolean. This function does not assume that the given expression is
 * necessarily a UnaryExpression; it simply toggles the presence of a leading
 * '!' in the source text.
 *
 * @param node - The ESLint expression node.
 * @param context - The ESLint rule context.
 * @param canStripNegation - Whether a leading '!' may be stripped.
 * @returns The expression with toggled negation.
 */
function toggleUnaryExpression(
  node: Expression,
  context: Rule.RuleContext,
  canStripNegation: boolean,
): string {
  let content = context.sourceCode.getText(node).trim()

  let lowPrecedenceTypes = new Set<Expression['type']>([
    'ArrowFunctionExpression',
    'ConditionalExpression',
    'AssignmentExpression',
    'SequenceExpression',
    'YieldExpression',
  ])
  if (lowPrecedenceTypes.has(node.type)) {
    return `!(${content})`
  }

  if (!canStripNegation) {
    return `!${content}`
  }

  return toggleCode(content)
}

/**
 * Toggles the negation of a logical expression. The expression is wrapped in
 * parentheses if it is not already parenthesized, and the leading '!' is
 * toggled, e.g. `a && b` becomes `!(a && b)`.
 *
 * @param node - The logical expression ESLint node.
 * @param context - The ESLint rule context.
 * @returns The toggled expression.
 */
function toggleLogicalExpression(
  node: LogicalExpression,
  context: Rule.RuleContext,
): string {
  let content = context.sourceCode.getText(node).trim()
  return toggleCode(parenthesize(content))
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
