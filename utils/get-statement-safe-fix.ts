import type { SourceCode, Rule, AST } from 'eslint'
import type { UnaryExpression } from 'estree'

interface RestrictedPositionOptions {
  /**
   * The negated expression ESLint node being fixed.
   */
  node: Rule.NodeParentExtension & UnaryExpression

  /**
   * The token before the node, or null if there is none.
   */
  previousToken: AST.Token | null

  /**
   * The source code object, used to access tokens.
   */
  sourceCode: SourceCode
}

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

/**
 * A position at the start of which the grammar restricts the first token of an
 * expression: an expression statement, the expression body of an arrow
 * function, or the expression of a default export.
 */
type RestrictedPosition = 'defaultExport' | 'arrowBody' | 'statement'

let braceStartPattern = /^\{/u
let classStartPattern = /^class(?![\w$])/u
/*
 * Comments between `async` and `function` or `let` and `[` are matched
 * unambiguously: a line comment runs to its line break, a block comment to its
 * own end. A fix that does not match then fails in linear time instead of
 * backtracking through every split of its comments.
 */
let functionStartPattern =
  /^(?:async(?:\s|\/\*[^*]*\*+(?:[^*/][^*]*\*+)*\/)+)?function(?![\w$])/u
let letBracketStartPattern =
  /^let(?:\s|\/\/.*[\n\r\u{2028}\u{2029}]|\/\*[^*]*\*+(?:[^*/][^*]*\*+)*\/)*\[/u
let automaticSemicolonHazardPattern = /^[(+\-/[`]/u
let leadingCommentsPattern = /^(?:\s|\/\/.*|\/\*[\s\S]*?\*\/)*/u
let safePreviousTokens = new Set([';', '{'])

let forbiddenStartPatterns: Record<RestrictedPosition, RegExp[]> = {
  statement: [
    braceStartPattern,
    functionStartPattern,
    classStartPattern,
    letBracketStartPattern,
  ],
  defaultExport: [functionStartPattern, classStartPattern],
  arrowBody: [braceStartPattern],
}

/**
 * Makes the fix text safe to use when the fixed node starts a position whose
 * first token the grammar restricts. A replacement beginning with a token the
 * position forbids would be parsed as a block or a declaration, or would not
 * parse at all, so it is wrapped in parentheses: at the start of an expression
 * statement a replacement beginning with `{`, `function`, `async function`,
 * `class`, or `let [`, at the start of the expression body of an arrow function
 * one beginning with `{`, and at the start of a default export one beginning
 * with `function`, `async function`, or `class`. At the start of a statement a
 * replacement beginning with `(`, `[`, a template literal, or an arithmetic
 * sign can also merge with an unterminated previous line through automatic
 * semicolon insertion and silently change the program, so in that case the fix
 * is withheld and the function returns null. Comments that the fix carries over
 * at its start are skipped, since the parser skips them too, and a line comment
 * at its end is kept apart from the added closing parenthesis. Fixes for nodes
 * that start no such position are returned unchanged.
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
  let { sourceCode } = context
  let previousToken = sourceCode.getTokenBefore(node)
  let position = getRestrictedPosition({ previousToken, sourceCode, node })

  if (!position) {
    return fix
  }

  let codeAfterComments = fix.replace(leadingCommentsPattern, '')
  let needsParens = forbiddenStartPatterns[position].some(pattern =>
    pattern.test(codeAfterComments),
  )
  let safeFix = fix

  if (needsParens) {
    let lineBreak = endsWithLineComment(node, sourceCode, fix) ? '\n' : ''
    safeFix = `(${fix}${lineBreak})`
  }

  let canMergeWithPreviousLine =
    position === 'statement' &&
    (needsParens || automaticSemicolonHazardPattern.test(codeAfterComments))

  if (
    canMergeWithPreviousLine &&
    previousToken &&
    !safePreviousTokens.has(previousToken.value)
  ) {
    return null
  }

  return safeFix
}

/**
 * Finds the restricted position that the given node starts. The node starts the
 * expression body of an arrow function when it directly follows `=>`, and the
 * expression of a default export when it directly follows `export default`. A
 * `default` without `export` before it is a property name, as in `a.default`.
 *
 * @param options - The node, the token before it, and the source code object.
 * @returns The restricted position that the node starts, or null if it starts
 *   none.
 */
function getRestrictedPosition({
  previousToken,
  sourceCode,
  node,
}: RestrictedPositionOptions): RestrictedPosition | null {
  if (previousToken?.value === '=>') {
    return 'arrowBody'
  }

  if (
    previousToken?.value === 'default' &&
    sourceCode.getTokenBefore(previousToken)?.value === 'export'
  ) {
    return 'defaultExport'
  }

  return startsExpressionStatement(node) ? 'statement' : null
}

/**
 * Checks whether the given node starts an expression statement.
 *
 * @param node - The negated expression ESLint node being fixed.
 * @returns True if the enclosing statement is an expression statement that
 *   begins with the node.
 */
function startsExpressionStatement(
  node: Rule.NodeParentExtension & UnaryExpression,
): boolean {
  let statement = findEnclosingStatement(node)

  return (
    statement.type === 'ExpressionStatement' &&
    statement.range !== undefined &&
    statement.range[0] === node.range?.[0]
  )
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
