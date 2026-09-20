import type { LogicalOperator, UnaryExpression, Expression } from 'estree'
import type { Rule } from 'eslint'

import { isLogicalExpression } from './is-logical-expression'
import { getGroupingParens } from './get-grouping-parens'

/**
 * Determines if the operand of a negated expression is a "pure" logical group -
 * meaning it doesn't mix different logical operators (&& and ||) without
 * grouping parentheses.
 *
 * Examples:
 *
 * - `!(a && b)` → true (no mixed operators)
 * - `!((a && b) || c)` → true (operators at different nesting levels)
 * - `!(a && b || c)` → false (mixed operators at same level).
 *
 * The function walks the AST of the operand and descends only into logical
 * expressions that are not wrapped in their own parentheses, so operators
 * inside strings, comments, template literals, regular expressions, or other
 * nested expressions do not affect the result.
 *
 * @param node - The negated expression node.
 * @param context - ESLint rule context, used to access tokens.
 * @returns True if the expression doesn't mix operators at the top level.
 */
export function isPureGroup(
  node: UnaryExpression,
  context: Rule.RuleContext,
): boolean {
  let operators = new Set<LogicalOperator>()
  let stack: Expression[] = [node.argument]

  while (stack.length > 0) {
    let expression = stack.pop()!

    if (isLogicalExpression(expression)) {
      operators.add(expression.operator)
      stack.push(
        ...[expression.left, expression.right].filter(
          operand => !getGroupingParens(operand, context.sourceCode),
        ),
      )
    }
  }

  return operators.size < 2
}
