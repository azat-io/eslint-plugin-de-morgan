import type { SourceCode, Rule } from 'eslint'
import type { UnaryExpression } from 'estree'

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
let leadingCommentsPattern = /^(?:\s|\/\/.*|\/\*[\s\S]*?\*\/)*/u
let safePreviousTokens = new Set([';', '{'])

/**
 * Makes the fix text safe to use when the fixed node starts an expression
 * statement. A replacement beginning with `function`, `class`, or `{` would be
 * parsed as a declaration or block instead of an expression, so it is wrapped
 * in parentheses. A replacement beginning with `(`, `[`, a template literal, or
 * an arithmetic sign can merge with an unterminated previous line through
 * automatic semicolon insertion and silently change the program, so in that
 * case the fix is withheld and the function returns null. Comments that the fix
 * carries over at its start are skipped, since the parser skips them too, and a
 * line comment at its end is kept apart from the added closing parenthesis.
 * Fixes for nodes that do not start an expression statement are returned
 * unchanged.
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

  let codeAfterComments = fix.replace(leadingCommentsPattern, '')
  let needsParens = statementKeywordStartPattern.test(codeAfterComments)
  let safeFix = fix

  if (needsParens) {
    let lineBreak =
      endsWithLineComment(node, context.sourceCode, fix) ? '\n' : ''
    safeFix = `(${fix}${lineBreak})`
  }

  if (needsParens || automaticSemicolonHazardPattern.test(codeAfterComments)) {
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

/**
 * Checks whether the fix text ends with a line comment carried over from the
 * end of the negated expression. A closing parenthesis added after such a
 * comment on the same line would become part of the comment.
 *
 * @param node - The negated expression ESLint node being fixed.
 * @param sourceCode - The source code object, used to access comments.
 * @param fix - The replacement text produced by the transform.
 * @returns True if the fix text ends with a line comment.
 */
function endsWithLineComment(
  node: UnaryExpression,
  sourceCode: SourceCode,
  fix: string,
): boolean {
  let lastComment = sourceCode.getCommentsInside(node).at(-1)

  return lastComment?.type === 'Line' && fix.endsWith(`//${lastComment.value}`)
}
