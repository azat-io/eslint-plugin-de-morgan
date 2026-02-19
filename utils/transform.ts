import type {
  LogicalExpression,
  UnaryExpression,
  LogicalOperator,
  Expression,
} from 'estree'
import type { Rule } from 'eslint'

import { toggleNegation } from './toggle-negation'
import { isConjunction } from './is-conjunction'
import { isDisjunction } from './is-disjunction'
import { parenthesize } from './parenthesize'

interface TransformUtilityOptions {
  /**
   * The source logical operator.
   */
  sourceOperator: LogicalOperator

  /**
   * The target logical operator.
   */
  targetOperator: LogicalOperator

  /**
   * The type of logical expression.
   */
  expressionType: ExpressionType

  /**
   * The logical expression to transform.
   */
  expression: LogicalExpression

  /**
   * The ESLint rule context.
   */
  context: Rule.RuleContext
}

interface TransformOptions {
  /**
   * The type of logical expression to transform.
   */
  expressionType: ExpressionType

  /**
   * Whether the transformed expression should be wrapped in parentheses.
   */
  shouldWrapInParens: boolean

  /**
   * The ESLint rule context.
   */
  context: Rule.RuleContext

  /**
   * The UnaryExpression node to transform.
   */
  node: UnaryExpression
}

interface FlattenOperandsOptions {
  /**
   * The type of logical expression.
   */
  expressionType: ExpressionType
  /**
   * The ESLint rule context.
   */
  context: Rule.RuleContext
  /**
   * The logical expression to flatten.
   */
  expression: Expression
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
 * @param options - The transformation options.
 * @returns The transformed expression or null if transformation is not
 *   applicable.
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

  let originalText = context.sourceCode.getText(argument)
  let targetOperator = OPERATOR_MAPPING[sourceOperator]!

  let transformUtilityOptions: TransformUtilityOptions = {
    expression: argument,
    expressionType,
    sourceOperator,
    targetOperator,
    context,
  }

  let result =
    hasSpecialFormatting(originalText) ?
      transformWithFormatting(transformUtilityOptions)
    : transformSimple(transformUtilityOptions)

  return parenthesize(result, shouldWrapInParens)
}

/**
 * Transforms an expression with special formatting (comments, multiple spaces).
 *
 * @param options - The transformation options.
 * @returns The transformed expression with preserved formatting.
 */
function transformWithFormatting({
  sourceOperator,
  targetOperator,
  expression,
  context,
}: TransformUtilityOptions): string {
  let { sourceCode } = context

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
 * Iteratively flattens a logical expression tree into a list of operands and
 * transforms them using a stack-based approach for better performance.
 *
 * @param options - The flattening options.
 * @returns Array of transformed operands.
 */
function flattenOperands({
  expressionType,
  expression,
  context,
}: FlattenOperandsOptions): string[] {
  let result: string[] = []
  let stack: { expr: Expression; depth: number }[] = [
    { expr: expression, depth: 0 },
  ]

  while (stack.length > 0) {
    let { depth, expr } = stack.pop()!

    if (depth > MAX_DEPTH || !matchesExpressionType(expr, expressionType)) {
      result.push(toggleNegation(expr, context))
      continue
    }

    let logicalExpr = expr as LogicalExpression
    stack.push(
      { expr: logicalExpr.right, depth: depth + 1 },
      { expr: logicalExpr.left, depth: depth + 1 },
    )
  }

  return result
}

/**
 * Transforms a simple logical expression without special formatting.
 *
 * @param options - The transformation options.
 * @returns The transformed expression.
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
 * @param expression - The expression to check.
 * @param type - The type to check against.
 * @returns True if the expression matches the type, false otherwise.
 */
function matchesExpressionType(
  expression: Expression,
  type: ExpressionType,
): boolean {
  return type === 'conjunction' ?
      isConjunction(expression)
    : isDisjunction(expression)
}

/**
 * Checks if the text contains special formatting like comments or multiple
 * spaces.
 *
 * @param text - The text to check.
 * @returns True if the text contains special formatting.
 */
function hasSpecialFormatting(text: string): boolean {
  return (
    text.includes('//') ||
    text.includes('/*') ||
    text.includes('\n') ||
    /\s{2,}/u.test(text)
  )
}
