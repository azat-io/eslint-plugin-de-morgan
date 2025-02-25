import type {
  LogicalExpression,
  UnaryExpression,
  LogicalOperator,
  Expression,
} from 'estree'
import type { Rule } from 'eslint'

import { toggleNegation } from './toggle-negation'
import { getSourceCode } from './get-source-code'
import { isConjunction } from './is-conjunction'
import { isDisjunction } from './is-disjunction'

interface TransformOptions {
  /** The type of logical expression to transform. */
  expressionType: 'conjunction' | 'disjunction'
  /** Whether the transformed expression should be wrapped in parentheses. */
  shouldWrapInParens: boolean
  /** The ESLint rule context. */
  context: Rule.RuleContext
  /** The UnaryExpression node to transform. */
  node: UnaryExpression
}

const MAX_DEPTH = 10

const OPERATOR_MAPPING: Partial<Record<LogicalOperator, LogicalOperator>> = {
  '&&': '||',
  '||': '&&',
}

/**
 * Checks if the expression matches the specified logical type.
 * @param {Expression} expr - The expression to check.
 * @param {'conjunction' | 'disjunction'} type - The type to check against.
 * @returns {boolean} True if the expression matches the type, false otherwise.
 */
let matchesExpressionType = (
  expr: Expression,
  type: 'conjunction' | 'disjunction',
): boolean => {
  if (type === 'conjunction') {
    return isConjunction(expr)
  }
  return isDisjunction(expr)
}

/**
 * Transforms a negated logical expression with preserved formatting according
 * to De Morgan's law. Can handle both conjunctions (!(A && B) -> !A || !B) and
 * disjunctions (!(A || B) -> !A && !B). Uses the toggleNegation function to
 * handle the negation logic consistently.
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
  let targetOperator: LogicalOperator = OPERATOR_MAPPING[sourceOperator]!

  if (argument.operator !== sourceOperator) {
    return null
  }

  let sourceCode = getSourceCode(context)

  let originalText = sourceCode.getText(argument)
  let hasSpecialFormatting =
    originalText.includes('//') ||
    originalText.includes('/*') ||
    originalText.includes('\n') ||
    /\s{2,}/u.test(originalText)

  if (hasSpecialFormatting && argument.left.range && argument.right.range) {
    let leftText = toggleNegation(argument.left, context)
    let rightText = toggleNegation(argument.right, context)

    let [, leftEnd] = argument.left.range
    let [rightStart] = argument.right.range
    let textBetween = sourceCode.text.slice(leftEnd, rightStart)

    let formattedOperator = textBetween.replaceAll(
      new RegExp(
        sourceOperator.replaceAll(/[$()*+.?[\\\]^{|}]/gu, '\\$&'),
        'gu',
      ),
      targetOperator,
    )

    let result = `${leftText}${formattedOperator}${rightText}`

    return shouldWrapInParens ? `(${result})` : result
  }

  let flattenOperands = (expr: Expression, depth = 0): string[] => {
    if (depth > MAX_DEPTH) {
      return [toggleNegation(expr, context)]
    }

    if (matchesExpressionType(expr, expressionType)) {
      let logicalExpr = expr as LogicalExpression
      return [
        ...flattenOperands(logicalExpr.left, depth + 1),
        ...flattenOperands(logicalExpr.right, depth + 1),
      ]
    }

    return [toggleNegation(expr, context)]
  }

  let operands = flattenOperands(argument)
  let result = operands.join(` ${targetOperator} `)

  return shouldWrapInParens ? `(${result})` : result
}
