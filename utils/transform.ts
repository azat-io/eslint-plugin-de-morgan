import type {
  LogicalExpression,
  UnaryExpression,
  LogicalOperator,
  Expression,
} from 'estree'
import type { Rule } from 'eslint'

import { getNodeContent } from './get-node-content'
import { toggleNegation } from './toggle-negation'
import { getSourceCode } from './get-source-code'
import { isConjunction } from './is-conjunction'
import { isDisjunction } from './is-disjunction'
import { parenthesize } from './parenthesize'

interface TransformUtilityOptions {
  /** The source logical operator. */
  sourceOperator: LogicalOperator

  /** The target logical operator. */
  targetOperator: LogicalOperator

  /** The type of logical expression. */
  expressionType: ExpressionType

  /** The logical expression to transform. */
  expression: LogicalExpression

  /** The ESLint rule context. */
  context: Rule.RuleContext
}

interface TransformOptions {
  /** The type of logical expression to transform. */
  expressionType: ExpressionType

  /** Whether the transformed expression should be wrapped in parentheses. */
  shouldWrapInParens: boolean

  /** The ESLint rule context. */
  context: Rule.RuleContext

  /** The UnaryExpression node to transform. */
  node: UnaryExpression
}

interface FlattenOperandsOptions {
  /** The type of logical expression. */
  expressionType: ExpressionType
  /** The ESLint rule context. */
  context: Rule.RuleContext
  /** The logical expression to flatten. */
  expression: Expression
  /** The current recursion depth. */
  depth?: number
}

type ExpressionType = 'conjunction' | 'disjunction'

const MAX_DEPTH = 10

const OPERATOR_MAPPING: Partial<Record<LogicalOperator, LogicalOperator>> = {
  '&&': '||',
  '||': '&&',
}

/**
 * Transforms a negated logical expression according to De Morgan's law. Can
 * handle both conjunctions `(!(A && B) -> !A || !B)` and disjunctions `(!(A ||
 * B) -> !A && !B)`. Preserves formatting, comments, and whitespace in the
 * transformed expression.
 *
 * @param {TransformOptions} options - The transformation options.
 * @returns {string | null} The transformed expression or null if transformation
 *   is not applicable.
 */
export function transform({
  shouldWrapInParens,
  expressionType,
  context,
  node,
}: TransformOptions): string | null {
  let argument = node.argument as LogicalExpression

  let sourceOperator: LogicalOperator =
    expressionType === 'conjunction' ? '&&' : '||'

  if (argument.operator !== sourceOperator) {
    return null
  }

  let originalText = getNodeContent(argument, context)
  let targetOperator = OPERATOR_MAPPING[sourceOperator]!

  let transformUtilityOptions: TransformUtilityOptions = {
    expression: argument,
    expressionType,
    sourceOperator,
    targetOperator,
    context,
  }

  let result = hasSpecialFormatting(originalText)
    ? transformWithFormatting(transformUtilityOptions)
    : transformSimple(transformUtilityOptions)

  return parenthesize(result, shouldWrapInParens)
}

/**
 * Transforms an expression with special formatting (comments, multiple spaces).
 *
 * @param {TransformUtilityOptions} options - The transformation options.
 * @returns {string} The transformed expression with preserved formatting.
 */
function transformWithFormatting({
  sourceOperator,
  targetOperator,
  expression,
  context,
}: TransformUtilityOptions): string {
  let sourceCode = getSourceCode(context)

  let leftText = toggleNegation(expression.left, context)
  let rightText = toggleNegation(expression.right, context)

  if (!expression.left.range || !expression.right.range) {
    return `${leftText} ${targetOperator} ${rightText}`
  }

  let [, leftEnd] = expression.left.range
  let [rightStart] = expression.right.range
  let textBetween = sourceCode.text.slice(leftEnd, rightStart)

  let endsWithOpeningParen = /\(\s*$/u.test(textBetween)

  if (endsWithOpeningParen) {
    textBetween = textBetween.replace(/\(\s*$/u, '')
  }

  let formattedOperator = textBetween.replaceAll(
    new RegExp(
      sourceOperator.replaceAll(/[$()*+.?[\\\]^{|}]/gu, String.raw`\$&`),
      'gu',
    ),
    targetOperator,
  )

  return `${leftText}${formattedOperator}${rightText}`
}

/**
 * Recursively flattens a logical expression tree into a list of operands and
 * transforms them.
 *
 * @param {FlattenOperandsOptions} options - The flattening options.
 * @returns {string[]} Array of transformed operands.
 */
function flattenOperands({
  expressionType,
  expression,
  depth = 0,
  context,
}: FlattenOperandsOptions): string[] {
  if (depth > MAX_DEPTH) {
    return [toggleNegation(expression, context)]
  }

  if (matchesExpressionType(expression, expressionType)) {
    let logicalExpr = expression as LogicalExpression
    return [
      ...flattenOperands({
        expression: logicalExpr.left,
        depth: depth + 1,
        expressionType,
        context,
      }),
      ...flattenOperands({
        expression: logicalExpr.right,
        depth: depth + 1,
        expressionType,
        context,
      }),
    ]
  }

  return [toggleNegation(expression, context)]
}

/**
 * Transforms a simple logical expression without special formatting.
 *
 * @param {TransformUtilityOptions} options - The transformation options.
 * @returns {string} The transformed expression.
 */
function transformSimple({
  expressionType,
  targetOperator,
  expression,
  context,
}: TransformUtilityOptions): string {
  let operands = flattenOperands({
    expressionType,
    expression,
    context,
  })

  return operands.join(` ${targetOperator} `)
}

/**
 * Checks if the expression matches the specified logical type.
 *
 * @param {Expression} expression - The expression to check.
 * @param {ExpressionType} type - The type to check against.
 * @returns {boolean} True if the expression matches the type, false otherwise.
 */
function matchesExpressionType(
  expression: Expression,
  type: ExpressionType,
): boolean {
  return type === 'conjunction'
    ? isConjunction(expression)
    : isDisjunction(expression)
}

/**
 * Checks if the text contains special formatting like comments or multiple
 * spaces.
 *
 * @param {string} text - The text to check.
 * @returns {boolean} True if the text contains special formatting.
 */
function hasSpecialFormatting(text: string): boolean {
  return (
    text.includes('//') ||
    text.includes('/*') ||
    text.includes('\n') ||
    /\s{2,}/u.test(text)
  )
}
