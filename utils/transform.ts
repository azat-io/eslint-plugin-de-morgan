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

interface TransformWithFormattingOptions {
  /** The source logical operator. */
  sourceOperator: LogicalOperator
  /** The target logical operator. */
  targetOperator: LogicalOperator
  /** The logical expression to transform. */
  expression: LogicalExpression
  /** The ESLint rule context. */
  context: Rule.RuleContext
}

interface TransformSimpleOptions {
  /** The target logical operator. */
  targetOperator: LogicalOperator
  /** The type of logical expression. */
  expressionType: ExpressionType
  /** The logical expression to transform. */
  expression: LogicalExpression
  /** The ESLint rule context. */
  context: Rule.RuleContext
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
 * Checks if the expression matches the specified logical type.
 * @param {Expression} expression - The expression to check.
 * @param {ExpressionType} type - The type to check against.
 * @returns {boolean} True if the expression matches the type, false otherwise.
 */
let matchesExpressionType = (
  expression: Expression,
  type: ExpressionType,
): boolean =>
  type === 'conjunction' ? isConjunction(expression) : isDisjunction(expression)

/**
 * Checks if the text contains special formatting like comments or multiple
 * spaces.
 * @param {string} text - The text to check.
 * @returns {boolean} True if the text contains special formatting.
 */
let hasSpecialFormatting = (text: string): boolean =>
  text.includes('//') ||
  text.includes('/*') ||
  text.includes('\n') ||
  /\s{2,}/u.test(text)

/**
 * Transforms an expression with special formatting (comments, multiple spaces).
 * @param {TransformWithFormattingOptions} options - The transformation options.
 * @returns {string} The transformed expression with preserved formatting.
 */
let transformWithFormatting = ({
  sourceOperator,
  targetOperator,
  expression,
  context,
}: TransformWithFormattingOptions): string => {
  let sourceCode = getSourceCode(context)

  let leftText = toggleNegation(expression.left, context)
  let rightText = toggleNegation(expression.right, context)

  if (!expression.left.range || !expression.right.range) {
    return `${leftText} ${targetOperator} ${rightText}`
  }

  let [, leftEnd] = expression.left.range
  let [rightStart] = expression.right.range
  let textBetween = sourceCode.text.slice(leftEnd, rightStart)

  let formattedOperator = textBetween.replaceAll(
    new RegExp(sourceOperator.replaceAll(/[$()*+.?[\\\]^{|}]/gu, '\\$&'), 'gu'),
    targetOperator,
  )

  return `${leftText}${formattedOperator}${rightText}`
}

/**
 * Recursively flattens a logical expression tree into a list of operands and
 * transforms them.
 * @param {FlattenOperandsOptions} options - The flattening options.
 * @returns {string[]} Array of transformed operands.
 */
let flattenOperands = ({
  expressionType,
  expression,
  depth = 0,
  context,
}: FlattenOperandsOptions): string[] => {
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
 * @param {TransformOptions} options - The transformation options.
 * @returns {string} The transformed expression.
 */
let transformSimple = ({
  expressionType,
  targetOperator,
  expression,
  context,
}: TransformSimpleOptions): string => {
  let operands = flattenOperands({
    expressionType,
    expression,
    context,
  })
  return operands.join(` ${targetOperator} `)
}

/**
 * Transforms a negated logical expression according to De Morgan's law.
 * Can handle both conjunctions `(!(A && B) -> !A || !B)` and disjunctions
 * `(!(A || B) -> !A && !B)`. Preserves formatting, comments, and whitespace in
 * the transformed expression.
 * @param {TransformOptions} options - The transformation options.
 * @returns {string | null} The transformed expression or null if transformation
 * is not applicable.
 */
export let transform = ({
  shouldWrapInParens,
  expressionType,
  context,
  node,
}: TransformOptions): string | null => {
  let argument = node.argument as LogicalExpression

  let sourceOperator: LogicalOperator =
    expressionType === 'conjunction' ? '&&' : '||'
  let targetOperator = OPERATOR_MAPPING[sourceOperator]!

  if (argument.operator !== sourceOperator) {
    return null
  }

  let originalText = getNodeContent(argument, context)

  let result = hasSpecialFormatting(originalText)
    ? transformWithFormatting({
        expression: argument,
        sourceOperator,
        targetOperator,
        context,
      })
    : transformSimple({
        expression: argument,
        expressionType,
        targetOperator,
        context,
      })

  return shouldWrapInParens ? `(${result})` : result
}
