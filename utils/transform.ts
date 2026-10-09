import type {
  LogicalExpression,
  UnaryExpression,
  LogicalOperator,
  Expression,
} from 'estree'
import type { SourceCode, Rule, AST } from 'eslint'

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

interface TrailingCommentsOptions {
  /**
   * The source code object, used to access comments and tokens.
   */
  sourceCode: SourceCode

  /**
   * The negated expression whose comments are collected.
   */
  node: UnaryExpression

  /**
   * Whether the transformed expression is wrapped in parentheses.
   */
  isWrapped: boolean
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

const LINE_BREAK_PATTERN = /[\n\r\u{2028}\u{2029}]/u

const LINE_BREAK_RESTRICTED_KEYWORDS = new Set(['return', 'throw', 'yield'])

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
  let { sourceCode } = context
  let leading = getLeadingComments(node, sourceCode)
  let isWrapped =
    shouldWrapInParens ||
    (LINE_BREAK_PATTERN.test(leading) &&
      followsLineBreakRestrictedKeyword(node, sourceCode))
  let trailing = getTrailingComments({ sourceCode, isWrapped, node })

  return parenthesize(leading + result + trailing, isWrapped)
}

/**
 * Collects the comments between the end of the argument and the end of the
 * negated expression, before its closing grouping parentheses. They keep the
 * whitespace that separates them from the argument, while the grouping
 * parentheses and the whitespace after the last comment are dropped. A trailing
 * line comment keeps its line break and the indentation after it whenever code
 * follows it on the same line, including the closing parenthesis added when the
 * result is wrapped.
 *
 * @param options - The negated expression, its source code, and whether the
 *   transformed expression is wrapped.
 * @returns The trailing comments with the whitespace before them, or an empty
 *   string if there are none.
 */
function getTrailingComments({
  sourceCode,
  isWrapped,
  node,
}: TrailingCommentsOptions): string {
  let { argument } = node
  let [, argumentEnd] = argument.range!
  let lastTrailingComment = sourceCode
    .getCommentsInside(node)
    .findLast(comment => comment.range![0] >= argumentEnd)

  if (!lastTrailingComment) {
    return ''
  }

  let trailing = sliceWithoutTokens(
    sourceCode.text,
    [argumentEnd, lastTrailingComment.range![1]],
    sourceCode.getTokensBetween(argument, lastTrailingComment),
  )
  let needsLineBreak =
    lastTrailingComment.type === 'Line' &&
    (isWrapped || !isFollowedByLineBreak(node, sourceCode))

  if (!needsLineBreak) {
    return trailing
  }

  let closingParen = sourceCode.getTokenAfter(lastTrailingComment)!
  return (
    trailing +
    sourceCode.text.slice(lastTrailingComment.range![1], closingParen.range[0])
  )
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
 * Collects the comments between the negation and the start of its argument:
 * after the `!`, around the opening grouping parentheses, and before the first
 * operand. The fix replaces the whole negated expression, while the transformed
 * text is built from the argument alone, so these comments are carried over in
 * front of it. They keep the whitespace that separates them from the argument,
 * while the grouping parentheses and the whitespace before the first comment
 * are dropped.
 *
 * @param node - The negated expression whose comments are collected.
 * @param sourceCode - The source code object, used to access comments and
 *   tokens.
 * @returns The leading comments with the whitespace after them, or an empty
 *   string if there are none.
 */
function getLeadingComments(
  node: UnaryExpression,
  sourceCode: SourceCode,
): string {
  let { argument } = node
  let [argumentStart] = argument.range!
  let firstLeadingComment = sourceCode
    .getCommentsInside(node)
    .find(comment => comment.range![1] <= argumentStart)

  if (!firstLeadingComment) {
    return ''
  }

  return sliceWithoutTokens(
    sourceCode.text,
    [firstLeadingComment.range![0], argumentStart],
    sourceCode.getTokensBetween(firstLeadingComment, argument),
  )
}

/**
 * Returns the source text of the given range without the given tokens. It
 * carries comments over while leaving out the grouping parentheses between
 * them.
 *
 * @param text - The full source text.
 * @param range - The range of the text to take.
 * @param tokens - The tokens inside the range to leave out, in source order.
 * @returns The text of the range without the tokens.
 */
function sliceWithoutTokens(
  text: string,
  [start, end]: [number, number],
  tokens: AST.Token[],
): string {
  let result = ''
  let position = start

  for (let token of tokens) {
    let [tokenStart, tokenEnd] = token.range
    result += text.slice(position, tokenStart)
    position = tokenEnd
  }

  return result + text.slice(position, end)
}

/**
 * Checks whether the code that follows the given node starts on a new line. At
 * the end of the file nothing follows the node, so the function returns false
 * there, and a line comment carried over to the end of the file keeps its line
 * break.
 *
 * @param node - The node to check.
 * @param sourceCode - The source code object, used to access tokens.
 * @returns True if a line break separates the node from the code after it.
 */
function isFollowedByLineBreak(
  node: UnaryExpression,
  sourceCode: SourceCode,
): boolean {
  let nextToken = sourceCode.getTokenAfter(node, { includeComments: true })

  return (
    nextToken !== null &&
    LINE_BREAK_PATTERN.test(
      sourceCode.text.slice(node.range![1], nextToken.range![0]),
    )
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
 * Checks whether the given node directly follows `return`, `throw`, or `yield`.
 * The grammar forbids a line break between these keywords and their argument,
 * so a comment with a line break can be moved in front of the node there only
 * inside parentheses.
 *
 * @param node - The node to check.
 * @param sourceCode - The source code object, used to access tokens.
 * @returns True if the node directly follows one of these keywords.
 */
function followsLineBreakRestrictedKeyword(
  node: UnaryExpression,
  sourceCode: SourceCode,
): boolean {
  let previousToken = sourceCode.getTokenBefore(node)

  return (
    previousToken !== null &&
    LINE_BREAK_RESTRICTED_KEYWORDS.has(previousToken.value)
  )
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
