import type { LogicalOperator, UnaryExpression } from 'estree'
import type { Rule } from 'eslint'

type ParentedNode = Rule.NodeParentExtension & UnaryExpression

/**
 * Checks whether the transformed expression must be wrapped in parentheses to
 * bind correctly inside its parent node. The original `!(…)` expression binds
 * as tightly as any unary operator, but the produced `&&`/`||` chain binds much
 * looser, so any parent that binds tighter than the produced operator would
 * otherwise capture only the first operand of the result. Parentheses are also
 * required when the parent is a `??` expression, which cannot be mixed with
 * `&&`/`||` without grouping, and inside a `for` statement initializer, where
 * the grammar forbids an unparenthesized `in` operator.
 *
 * @param node - The negated expression ESLint node being fixed.
 * @param targetOperator - The logical operator produced by the fix.
 * @returns True if the fix result must be wrapped in parentheses.
 */
export function needsParentParens(
  node: ParentedNode,
  targetOperator: LogicalOperator,
): boolean {
  if (isInsideForInitializer(node)) {
    return true
  }

  let { parent } = node
  switch (parent.type) {
    case 'TaggedTemplateExpression':
    case 'BinaryExpression':
    case 'AwaitExpression':
    case 'UnaryExpression':
      return true
    case 'LogicalExpression':
      return (
        parent.operator === '??' ||
        (targetOperator === '||' && parent.operator === '&&')
      )
    case 'MemberExpression':
      return parent.object === node
    case 'CallExpression':
    case 'NewExpression':
      return parent.callee === node
    default:
      return false
  }
}

/**
 * Checks whether the given node belongs to the initializer of a `for`
 * statement. The NoIn grammar restriction forbids an unparenthesized `in`
 * operator in that position, so the fix result has to be grouped there.
 *
 * @param node - The ESLint node to check.
 * @returns True if the node is part of a `for` statement initializer.
 */
function isInsideForInitializer(node: ParentedNode): boolean {
  let current: Rule.Node = node
  while (
    current.parent &&
    (current.parent.type === 'VariableDeclarator' ||
      current.parent.type === 'VariableDeclaration' ||
      current.parent.type.endsWith('Expression'))
  ) {
    current = current.parent
  }
  return (
    current.parent?.type === 'ForStatement' && current.parent.init === current
  )
}
