import type { UnaryExpression } from 'estree'
import type { Rule } from 'eslint'

interface GetStatementSafeFixOptions {
  /**
   * The negated expression ESLint node being fixed.
   */
  node: Rule.NodeParentExtension & UnaryExpression

  /**
   * The ESLint rule context.
   */
  context: Rule.RuleContext

  /**
   * The replacement text produced by the transform.
   */
  fix: string
}

let statementKeywordStartPattern = /^(?:function(?![\w$])|class(?![\w$])|\{)/u
let automaticSemicolonHazardPattern = /^[(+\-/[`]/u
let safePreviousTokens = new Set([';', '{'])

/**
 * Makes the fix text safe to use when the fixed node starts an expression
 * statement. A replacement beginning with `function`, `class`, or `{` would be
 * parsed as a declaration or block instead of an expression, so it is wrapped
 * in parentheses. A replacement beginning with `(`, `[`, a template literal, or
 * an arithmetic sign can merge with an unterminated previous line through
 * automatic semicolon insertion and silently change the program, so in that
 * case the fix is withheld and the function returns null. Fixes for nodes that
 * do not start an expression statement are returned unchanged.
 *
 * @param options - The statement safety options.
 * @returns The fix text, wrapped in parentheses when required, or null if the
 *   fix cannot be applied safely.
 */
export function getStatementSafeFix({
  context,
  node,
  fix,
}: GetStatementSafeFixOptions): string | null {
  let statement = findEnclosingStatement(node)
  if (statement.type !== 'ExpressionStatement') {
    return fix
  }

  if (!statement.range || !node.range) {
    return fix
  }

  if (statement.range[0] !== node.range[0]) {
    return fix
  }

  let safeFix = statementKeywordStartPattern.test(fix) ? `(${fix})` : fix

  if (automaticSemicolonHazardPattern.test(safeFix)) {
    let previousToken = context.sourceCode.getTokenBefore(statement)
    if (previousToken && !safePreviousTokens.has(previousToken.value)) {
      return null
    }
  }

  return safeFix
}

/**
 * Finds the closest statement containing the given node. Climbs the ancestor
 * chain until a statement or the top-level program node is reached.
 *
 * @param node - The ESLint node to find the enclosing statement for.
 * @returns The enclosing statement node, or the program node if the node is not
 *   inside a statement.
 */
function findEnclosingStatement(
  node: Rule.NodeParentExtension & UnaryExpression,
): Rule.Node {
  let current: Rule.Node = node
  while (!current.type.endsWith('Statement') && current.type !== 'Program') {
    current = current.parent
  }
  return current
}
