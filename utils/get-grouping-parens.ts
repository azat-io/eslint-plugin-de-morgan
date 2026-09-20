import type { SourceCode, AST } from 'eslint'
import type { Expression } from 'estree'

/**
 * Finds the outermost pair of grouping parentheses around an operand of a
 * logical expression. A logical expression has no syntax parentheses of its
 * own, so a pair of parentheses right around its operand always groups that
 * operand. Nested pairs, such as `((a))`, are all treated as grouping, and the
 * outermost pair is returned.
 *
 * @param node - The operand of a logical expression.
 * @param sourceCode - The source code object, used to access tokens.
 * @returns The opening and closing parenthesis tokens, or null if the operand
 *   is not wrapped in parentheses.
 */
export function getGroupingParens(
  node: Expression,
  sourceCode: SourceCode,
): [AST.Token, AST.Token] | null {
  let parens: [AST.Token, AST.Token] | null = null
  let opening = sourceCode.getTokenBefore(node)
  let closing = sourceCode.getTokenAfter(node)

  while (opening?.value === '(' && closing?.value === ')') {
    parens = [opening, closing]
    opening = sourceCode.getTokenBefore(opening)
    closing = sourceCode.getTokenAfter(closing)
  }

  return parens
}
