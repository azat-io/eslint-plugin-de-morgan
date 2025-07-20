import type { Expression, Node } from 'estree'
import type { Rule } from 'eslint'

import { findOutermostParenthesizedNode } from './find-outermost-parenthesized-node'
import { getNodeContent } from './get-node-content'
import { getSourceCode } from './get-source-code'

type ParentedNode = { parent?: ParentedNode } & Node

/**
 * Determines if a logical expression is "pure" - meaning it doesn't mix
 * different logical operators (&& and ||) at the same nesting level within its
 * outermost parentheses.
 *
 * Examples:
 *
 * - `!(a && b)` → true (no mixed operators)
 * - `((a && b) || c)` → true (operators at different nesting levels)
 * - `(a && b || c)` → false (mixed operators at same level)
 *
 * The function traverses up the AST to find the outermost parenthesized
 * expression, then analyzes the logical operators within that scope.
 *
 * @param {Expression} node - The AST node to analyze
 * @param {Rule.RuleContext} context - ESLint rule context, used to get source
 *   code.
 * @returns {boolean} True if the expression doesn't mix operators at the top
 *   level.
 */
export function isPureGroup(
  node: Expression,
  context: Rule.RuleContext,
): boolean {
  let sourceCode = getSourceCode(context).getText()
  let outermostNode = findOutermostParenthesizedNode(
    node as ParentedNode,
    sourceCode,
  )
  let fullCode = getNodeContent(outermostNode, context)
  let innerCode = getCodeInsideParentheses(fullCode)

  return !hasMixedOperators(innerCode)
}

/**
 * Analyzes the given code string (which is assumed to have no outer
 * parentheses) and determines if, at the top level (outside of any nested
 * groups), the logical operators are uniform. In other words, if both `&&` and
 * `||` are found at the top level, it returns true indicating a mix.
 *
 * @param {string} code - The code string to analyze.
 * @returns {boolean} True if a mix of `&&` and `||` is found at the top level,
 *   false otherwise.
 */
function hasMixedOperators(code: string): boolean {
  let depth = 0
  let operatorFound: string | null = null

  for (let i = 0; i < code.length; i++) {
    let char = code[i]
    if (char === '(') {
      depth++
      continue
    }
    if (char === ')') {
      depth--
      continue
    }
    if (depth !== 0) {
      continue
    }

    let twoChars = code.slice(i, i + 2)
    if (twoChars === '&&' || twoChars === '||') {
      if (operatorFound === null) {
        operatorFound = twoChars
      } else if (operatorFound !== twoChars) {
        return true
      }
      i++
    }
  }

  return false
}

/**
 * Extracts the inner code from a code string that is wrapped in parentheses. If
 * the code starts with `!(`, the function removes the leading `!(` and the
 * final `)`. If it starts with `(` it removes only the outer parentheses.
 *
 * @param {string} code - The code string to process.
 * @returns {string} The inner code, with the outermost parentheses removed.
 */
function getCodeInsideParentheses(code: string): string {
  if (code.startsWith('!(')) {
    return code.slice(2, -1)
  }
  if (code.startsWith('(')) {
    return code.slice(1, -1)
  }
  return code
}
