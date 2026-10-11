import type { UnaryExpression } from 'estree'
import type { Rule } from 'eslint'

import { Linter } from 'eslint'

/**
 * A negated expression whose argument is a logical expression, the node the
 * rules of this plugin report.
 */
export type NegatedGroup = Rule.NodeParentExtension & UnaryExpression

let linter = new Linter()

/**
 * Parses the code with ESLint and passes the first node that matches the
 * selector to the callback, together with the rule context ESLint created for
 * it. Utilities are then tested on the same AST, tokens and comments that a
 * rule gets, instead of hand-built nodes.
 *
 * @example
 *
 * ```ts
 * let parentType = inspectNode(
 *   'f(a === b)',
 *   'BinaryExpression',
 *   node => node.parent.type,
 * )
 * ```
 *
 * @param code - The code to parse as an ES module.
 * @param selector - The ESLint selector of the node to inspect.
 * @param inspect - Receives the first matching node and the rule context.
 * @returns What the callback returned for the first matching node.
 */
export function inspectNode<Result>(
  code: string,
  selector: string,
  inspect: (node: Rule.Node, context: Rule.RuleContext) => Result,
): Result {
  let results: Result[] = []
  let rule: Rule.RuleModule = {
    create: context => ({
      [selector]: (node: Rule.Node) => {
        if (results.length === 0) {
          results.push(inspect(node, context))
        }
      },
    }),
  }

  let messages = linter.verify(code, {
    plugins: { test: { rules: { inspect: rule } } },
    rules: { 'test/inspect': 'error' },
  })

  if (results.length === 0) {
    let problems = messages.map(message => message.message).join(' ')
    throw new Error(`No node matches ${selector} in ${code}. ${problems}`)
  }
  return results[0] as Result
}

/**
 * Parses the code with ESLint and passes its first negated logical expression,
 * such as `!(a && b)`, to the callback together with the rule context.
 *
 * @example
 *
 * ```ts
 * let parentType = inspectNegatedGroup(
 *   'if (!(a && b)) {}',
 *   node => node.parent.type,
 * )
 * ```
 *
 * @param code - The code to parse as an ES module.
 * @param inspect - Receives the negated expression and the rule context.
 * @returns What the callback returned.
 */
export function inspectNegatedGroup<Result>(
  code: string,
  inspect: (node: NegatedGroup, context: Rule.RuleContext) => Result,
): Result {
  return inspectNode(
    code,
    'UnaryExpression[operator="!"][argument.type="LogicalExpression"]',
    (node, context) => inspect(node as NegatedGroup, context),
  )
}
