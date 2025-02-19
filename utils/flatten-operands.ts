import type { LogicalExpression, Expression } from 'estree'
import type { Rule } from 'eslint'

import { getNodeContent } from './get-node-content'

export interface FlattenOperandsOptions<T extends Expression> {
  /**
   * A transformer function that processes an individual operand.
   * For example, it can toggle its negation.
   */
  transformer(expr: T, context: Rule.RuleContext): string
  /**
   * A predicate function that returns true if the expression should be further
   * flattened. For example, for a conjunction, you can pass isConjunction.
   */
  predicate(expr: T): boolean
  /** The ESLint rule context. */
  context: Rule.RuleContext
  /** The current recursion depth. */
  depth?: number
  /** The expression to flatten. Typically a LogicalExpression. */
  expression: T
}

const MAX_DEPTH = 10

/**
 * Recursively flattens an expression tree into its individual operands using a
 * given predicate, and applies a transformation function to each operand. This
 * function is generic and can be used to flatten both conjunctions and
 * disjunctions, depending on the predicate and transformer passed to it. For
 * example, if the expression is a conjunction (a && b && c) and the transformer
 * toggles negation, the function returns an array:
 * `[toggleNegation(a), toggleNegation(b), toggleNegation(c)]`.
 * @template T The type of the expression node (typically LogicalExpression).
 * @param {FlattenOperandsOptions<T>} options - An object containing:
 * - expression: The expression to flatten.
 * - context: The ESLint rule context.
 * - predicate: A function that returns true if the expression should be further
 * flattened.
 * - transformer: A function that transforms an individual operand.
 * @returns {string[]} An array of transformed operands.
 */
export let flattenOperands = <T extends Expression>({
  transformer,
  expression,
  predicate,
  depth = 0,
  context,
}: FlattenOperandsOptions<T>): string[] => {
  if (depth > MAX_DEPTH) {
    return [getNodeContent(expression, context).trim()]
  }

  if (predicate(expression)) {
    let logicalExpr = expression as LogicalExpression
    return [
      ...flattenOperands({
        expression: logicalExpr.left,
        depth: depth + 1,
        transformer,
        predicate,
        context,
      }),
      ...flattenOperands({
        expression: logicalExpr.right,
        depth: depth + 1,
        transformer,
        predicate,
        context,
      }),
    ]
  }
  return [transformer(expression, context)]
}
