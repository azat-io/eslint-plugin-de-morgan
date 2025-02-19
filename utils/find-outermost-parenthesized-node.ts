import type { Node } from 'estree'

import { isLogicalExpression } from './is-logical-expression'

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
export let findOutermostParenthesizedNode = (
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
