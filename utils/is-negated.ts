import type { UnaryExpression, Node } from 'estree'

type ParentedNode = { parent?: Node } & Node

/**
 * Checks whether the given AST node is a negated expression.
 * @param {Node} node - The AST node to check.
 * @returns {node is UnaryExpression} True if the node is a UnaryExpression with
 * operator `!`.
 */
export let isNegated = (node: ParentedNode): node is UnaryExpression =>
  node.type === 'UnaryExpression' &&
  node.operator === '!' &&
  (node.argument.type !== 'UnaryExpression' ||
    node.argument.operator !== '!') &&
  (!node.parent ||
    node.parent.type !== 'UnaryExpression' ||
    node.parent.operator !== '!')
