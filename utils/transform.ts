import type {
  LogicalExpression,
  UnaryExpression,
  LogicalOperator,
  Expression,
} from 'estree'
import type { Rule } from 'eslint'

import { getGroupingParens } from './get-grouping-parens'
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
   * Whether a leading '!' may be stripped from already negated operands.
   */
  canStripNegation: boolean

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
   * Whether a leading '!' may be stripped from already negated operands.
   */
  canStripNegation: boolean

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
   * Whether a leading '!' may be stripped from already negated operands.
   */
  canStripNegation: boolean
  /**
   * The ESLint rule context.
   */
  context: Rule.RuleContext
  /**
   * The logical expression to flatten.
   */
  expression: Expression
}

interface NegatedOperand {
  /**
   * The range of the original operand, including its grouping parentheses.
   */
  range: [number, number]

  /**
   * The negated operand text.
   */
  text: string
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
  canStripNegation,
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
    canStripNegation,
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
 * Negates an operand of a logical expression. The grouping parentheses of the
 * operand are dropped, unless they contain comments: such an operand is negated
 * together with its parentheses, so the comments are preserved.
 *
 * @param node - The operand to negate.
 * @param context - The ESLint rule context.
 * @param canStripNegation - Whether a leading '!' may be stripped from an
 *   already negated operand.
 * @returns The negated operand and the range of the original operand.
 */
function negateOperand(
  node: Expression,
  context: Rule.RuleContext,
  canStripNegation: boolean,
): NegatedOperand {
  let { sourceCode } = context
  let parens = getGroupingParens(node, sourceCode)

  if (!parens) {
    return {
      text: toggleNegation(node, context, canStripNegation),
      range: node.range!,
    }
  }

  let [opening, closing] = parens
  let range: [number, number] = [opening.range[0], closing.range[1]]
  let hasComments =
    sourceCode.commentsExistBetween(opening, node) ||
    sourceCode.commentsExistBetween(node, closing)

  return {
    text:
      hasComments ?
        `!${sourceCode.text.slice(...range)}`
      : toggleNegation(node, context, canStripNegation),
    range,
  }
}

/**
 * Iteratively flattens a logical expression tree into a list of operands and
 * transforms them using a stack-based approach for better performance.
 *
 * @param options - The flattening options.
 * @returns Array of transformed operands.
 */
function flattenOperands({
  canStripNegation,
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
      result.push(toggleNegation(expr, context, canStripNegation))
      continue
    }

    let logicalExpression = expr as LogicalExpression
    stack.push(
      { expr: logicalExpression.right, depth: depth + 1 },
      { expr: logicalExpression.left, depth: depth + 1 },
    )
  }

  return result
}

/**
 * Transforms an expression with special formatting (comments, multiple spaces).
 * The text between the operands is taken from outside their grouping
 * parentheses, so it contains only whitespace, comments, and the operator. The
 * operator token is replaced by its position, which leaves comments intact.
 *
 * @param options - The transformation options.
 * @returns The transformed expression with preserved formatting.
 */
function transformWithFormatting({
  canStripNegation,
  sourceOperator,
  targetOperator,
  expression,
  context,
}: TransformUtilityOptions): string {
  let { sourceCode } = context

  let left = negateOperand(expression.left, context, canStripNegation)
  let right = negateOperand(expression.right, context, canStripNegation)
  let operatorToken = sourceCode.getTokenAfter(expression.left, {
    filter: token => token.value === sourceOperator,
  })!

  return (
    left.text +
    sourceCode.text.slice(left.range[1], operatorToken.range[0]) +
    targetOperator +
    sourceCode.text.slice(operatorToken.range[1], right.range[0]) +
    right.text
  )
}

/**
 * Transforms a simple logical expression without special formatting.
 *
 * @param options - The transformation options.
 * @returns The transformed expression.
 */
function transformSimple({
  canStripNegation,
  expressionType,
  targetOperator,
  expression,
  context,
}: TransformUtilityOptions): string {
  let operands = flattenOperands({
    canStripNegation,
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
