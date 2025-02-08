import type { LogicalOperator } from 'estree'

/**
 * Joins an array of operand strings using the specified logical operator.
 * Optionally wraps the resulting expression in parentheses.
 * @param {string[]} operands - The array of operand strings.
 * @param {boolean} [wrap] - If true, wraps the resulting expression in
 * parentheses.
 * @param {LogicalOperator} operator - The logical operator to use for joining
 * (e.g., '||' or '&&').
 * @returns {string} The joined expression.
 */
export let joinOperands = (
  operands: string[],
  wrap: boolean,
  operator: LogicalOperator,
): string => {
  let joined = operands.join(` ${operator} `)
  return wrap ? `(${joined})` : joined
}
