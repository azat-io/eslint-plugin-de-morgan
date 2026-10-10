/*
 * Sticky patterns for the pieces of a code snippet, each tried at the current
 * position: a run of whitespace and comments, a string or template literal, a
 * regular expression literal, and a word (an identifier, a keyword, or a
 * number). Comments are matched unambiguously, as in `getStatementSafeFix`.
 */
let triviaPattern =
  /(?:\s|\/\/[^\n\r\u{2028}\u{2029}]*|\/\*[^*]*\*+(?:[^*/][^*]*\*+)*\/)+/uy
let stringPattern =
  /(?<quote>["'])(?:\\[\s\S]|(?!\k<quote>)[^\n\r\\])*\k<quote>|`(?:\\[\s\S]|[^\\`])*`/uy
let regularExpressionPattern =
  /\/(?![*/])(?:\\.|\[(?:\\.|[^\n\r\\\]])*\]|[^\n\r/[\\])+\/[a-z]*/uy
let wordPattern = /[\p{ID_Continue}$\u{200C}\u{200D}]+/uy

/**
 * Words after which a slash starts a regular expression instead of a division.
 */
let keywordsBeforeExpression = new Set([
  'instanceof',
  'typeof',
  'delete',
  'return',
  'await',
  'throw',
  'yield',
  'case',
  'else',
  'void',
  'do',
  'in',
])

/**
 * Characters that end an operand, so that a slash after them is a division.
 */
let operandEndCharacters = new Set([')', ']', '}'])

/**
 * Prepares a code snippet for display in error messages by removing comments
 * and normalizing whitespace to a single line. The snippet is read piece by
 * piece from left to right, so a quote inside a comment does not open a string
 * and `//` inside a regular expression does not open a comment. String,
 * template, and regular expression literals are kept as they are. Every run of
 * whitespace and comments becomes a single space, since a comment separates
 * code like whitespace does, and disappears at the ends of the snippet and next
 * to parentheses.
 *
 * @param code - The code snippet to clean.
 * @returns The cleaned single-line code without comments.
 */
export function sanitizeCode(code: string): string {
  let parts: string[] = []
  let position = 0
  let isSlashDivision = false

  while (position < code.length) {
    let trivia = matchAt(triviaPattern, code, position)
    if (trivia) {
      let end = position + trivia.length
      let isAtEdge = position === 0 || end === code.length
      let isNextToParenthesis = code[position - 1] === '(' || code[end] === ')'
      parts.push(isAtEdge || isNextToParenthesis ? '' : ' ')
      position = end
      continue
    }

    let literal =
      matchAt(stringPattern, code, position) ??
      (isSlashDivision ? null : (
        matchAt(regularExpressionPattern, code, position)
      ))
    if (literal) {
      parts.push(literal)
      position += literal.length
      isSlashDivision = true
      continue
    }

    let word = matchAt(wordPattern, code, position)
    if (word) {
      parts.push(word)
      position += word.length
      isSlashDivision = !keywordsBeforeExpression.has(word)
      continue
    }

    let character = code[position]!
    parts.push(character)
    position += 1
    isSlashDivision = operandEndCharacters.has(character)
  }

  return parts.join('')
}

/**
 * Matches a sticky pattern at the given position of the text.
 *
 * @param pattern - The sticky pattern to match.
 * @param text - The text to match against.
 * @param position - The position at which the match must start.
 * @returns The matched text, or null if the pattern does not match there.
 */
function matchAt(
  pattern: RegExp,
  text: string,
  position: number,
): string | null {
  pattern.lastIndex = position
  return pattern.exec(text)?.[0] ?? null
}
