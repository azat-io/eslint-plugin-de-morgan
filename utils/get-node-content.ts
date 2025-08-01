import type { Rule } from 'eslint'
import type { Node } from 'estree'

import { getSourceCode } from './get-source-code'

/**
 * Retrieves the source code text of the given AST node using the provided
 * context.
 *
 * @param node - The AST node.
 * @param context - The ESLint rule context.
 * @returns The source code corresponding to the node.
 */
export function getNodeContent(node: Node, context: Rule.RuleContext): string {
  return getSourceCode(context).getText(node)
}
