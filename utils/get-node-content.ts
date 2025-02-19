import type { Rule } from 'eslint'
import type { Node } from 'estree'

import { getSourceCode } from './get-source-code'

/**
 * Retrieves the source code text of the given AST node using the provided
 * context.
 * @param {Node} node - The AST node.
 * @param {Rule.RuleContext} context - The ESLint rule context.
 * @returns {string} The source code corresponding to the node.
 */
export let getNodeContent = (node: Node, context: Rule.RuleContext): string =>
  getSourceCode(context).getText(node)
