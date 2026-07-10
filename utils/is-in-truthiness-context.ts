import type { Rule } from 'eslint'

/**
 * Checks whether the given expression is consumed only for its truthiness. In
 * such positions — statement conditions, ternary tests, logical negation, or a
 * discarded expression statement — replacing a strict boolean with any value of
 * the same truthiness is observable-behavior preserving. The check climbs
 * through `&&`/`||` chains, ternary branches, and trailing sequence positions,
 * because those forward the value to their own consumer. Any other consumer
 * (comparison, assignment, function argument, `return`, `??`, and so on) uses
 * the value itself, so the function returns false there.
 *
 * @param node - The negated expression ESLint node to check.
 * @returns True if only the truthiness of the expression is observable.
 */
export function isInTruthinessContext(node: Rule.Node): boolean {
  let { parent } = node
  if (!parent) {
    return false
  }

  switch (parent.type) {
    case 'ConditionalExpression':
      return parent.test === node || isInTruthinessContext(parent)
    case 'ExpressionStatement':
    case 'DoWhileStatement':
    case 'WhileStatement':
    case 'ForStatement':
    case 'IfStatement':
      return true
    case 'SequenceExpression':
      return parent.expressions.at(-1) !== node || isInTruthinessContext(parent)
    case 'LogicalExpression':
      return parent.operator !== '??' && isInTruthinessContext(parent)
    case 'UnaryExpression':
      return parent.operator === '!'
    default:
      return false
  }
}
