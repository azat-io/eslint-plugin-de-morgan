import type { Expression, Node } from 'estree'
import type { Rule } from 'eslint'

import { isLogicalExpression } from './is-logical-expression'
import { getNodeContent } from './get-node-content'
import { getSourceCode } from './get-source-code'

type ParentedNode = { parent?: ParentedNode } & Node

/**
 * Checks if the characters immediately before and at the end of the given
 * node's range in the source code form a pair of parentheses.
 * @param {number} start - The start index of the node's range.
 * @param {number} end - The end index of the node's range.
 * @param {string} sourceCode - The full source code text.
 * @returns {boolean} True if the character immediately before start is `(` and
 * the character at index end is `)`, false otherwise.
 */
let isInParentheses = (
  start: number,
  end: number,
  sourceCode: string,
): boolean => sourceCode[start - 1] === '(' && sourceCode[end] === ')'

/**
 * Traverses up the parent chain of the given node (if available) to find the
 * outermost logical expression node that is explicitly wrapped in parentheses.
 * The function checks the node and its parents (while they are
 * LogicalExpression) and returns the first node that is wrapped in parentheses
 * (i.e. where the characters immediately before its range and at its end form a
 * matching pair of parentheses). If none is found, the function returns the
 * topmost LogicalExpression.
 * @param {ParentedNode} node - The starting expression node.
 * @param {string} sourceCode - The full source code text.
 * @returns {ParentedNode} The outermost parenthesized node found in the parent
 * chain.
 */
let findOutermostParenthesizedNode = (
  node: ParentedNode,
  sourceCode: string,
): ParentedNode => {
  let current = node
  let [start, end] = current.range!

  if (isInParentheses(start, end, sourceCode)) {
    return current
  }

  while (current.parent && isLogicalExpression(current)) {
    current = current.parent
    ;[start, end] = current.range!

    if (isInParentheses(start, end, sourceCode)) {
      return current
    }
  }

  return current
}

/**
 * Extracts the inner code from a code string that is wrapped in parentheses. If
 * the code starts with `!(`, the function removes the leading `!(` and the
 * final `)`. If it starts with `(` it removes only the outer parentheses.
 * @param {string} code - The code string to process.
 * @returns {string} The inner code, with the outermost parentheses removed.
 */
let getCodeInsideParentheses = (code: string): string => {
  if (code.startsWith('!(')) {
    return code.slice(2, -1)
  }
  if (code.startsWith('(')) {
    return code.slice(1, -1)
  }
  return code
}

/**
 * Analyzes the given code string (which is assumed to have no outer
 * parentheses) and determines if, at the top level (outside of any nested
 * groups), the logical operators are uniform. In other words, if both `&&` and
 * `||` are found at the top level, it returns true indicating a mix.
 * @param {string} code - The code string to analyze.
 * @returns {boolean} True if a mix of `&&` and `||` is found at the top level,
 * false otherwise.
 */
let hasMixedOperators = (code: string): boolean => {
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
 * Determines if a logical expression is "pure" - meaning it doesn't mix
 * different logical operators (&& and ||) at the same nesting level within its
 * outermost parentheses.
 *
 * Examples:
 * - `!(a && b)` → true (no mixed operators)
 * - `((a && b) || c)` → true (operators at different nesting levels)
 * - `(a && b || c)` → false (mixed operators at same level)
 *
 * The function traverses up the AST to find the outermost parenthesized
 * expression, then analyzes the logical operators within that scope.
 * @param {Expression} node - The AST node to analyze
 * @param {Rule.RuleContext} context - ESLint rule context, used to get source
 * code.
 * @returns {boolean} True if the expression doesn't mix operators at the top
 * level.
 */
export let isPureGroup = (
  node: Expression,
  context: Rule.RuleContext,
): boolean => {
  let sourceCode = getSourceCode(context).getText()
  let outermostNode = findOutermostParenthesizedNode(
    node as ParentedNode,
    sourceCode,
  )
  let fullCode = getNodeContent(outermostNode, context)
  let innerCode = getCodeInsideParentheses(fullCode)

  return !hasMixedOperators(innerCode)
}
