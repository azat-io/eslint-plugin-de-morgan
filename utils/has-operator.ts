import type {
  LogicalExpression,
  LogicalOperator,
  UnaryExpression,
  UnaryOperator,
} from 'estree'

/**
 * Creates a predicate function that checks if an AST node has a specific
 * operator.
 *
 * @example
 *   // Check for logical AND operator
 *   const isAnd = hasOperator('&&')
 *   isAnd({ type: 'LogicalExpression', operator: '&&' }) // returns true
 *
 * @example
 *   // Check for logical NOT operator
 *   const isNot = hasOperator('!')
 *   isNot({ type: 'UnaryExpression', operator: '!' }) // returns true
 *
 * @param operator - The operator to check for. For LogicalOperator: `&&`, `||`,
 *   `??` For UnaryOperator: `-`, `+`, `!`, `~`, `typeof`, etc.
 * @returns A predicate function that:
 *
 *   - Takes a LogicalExpression or UnaryExpression node
 *   - Returns `true` if the node's operator matches the specified operator
 *   - Returns `false` otherwise.
 */
export function hasOperator(operator: LogicalOperator | UnaryOperator) {
  return (node: LogicalExpression | UnaryExpression): boolean =>
    node.operator === operator
}
