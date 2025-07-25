import type { SourceCode, Rule } from 'eslint'

/**
 * Retrieves the source code object from the given ESLint rule context.
 *
 * @param {Rule.RuleContext} context - The ESLint rule context.
 * @returns {SourceCode} The source code object.
 */
export function getSourceCode(context: Rule.RuleContext): SourceCode {
  return (
    // eslint-disable-next-line typescript/no-unnecessary-condition
    context.sourceCode ?? context.getSourceCode()
  )
}
