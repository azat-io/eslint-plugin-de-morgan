/**
 * Prepares a code snippet for display in error messages by removing comments
 * and normalizing whitespace to a single line.
 *
 * @param {string} code - The code snippet to clean.
 * @returns {string} The cleaned single-line code without comments.
 */
export function sanitizeCode(code: string): string {
  let stringLiterals: string[] = []

  let withoutStrings = code.replaceAll(
    /(?<quote>["'`])(?:\\.|(?!\k<quote>)[^\\])*\k<quote>/gu,
    match => {
      let placeholder = `__STRING_LITERAL_${stringLiterals.length}__`
      stringLiterals.push(match)
      return placeholder
    },
  )
  let withoutSingleLineComments = withoutStrings.replaceAll(/\/\/.*$/gmu, '')
  let withoutComments = withoutSingleLineComments.replaceAll(
    /\/\*[\s\S]*?\*\//gu,
    '',
  )

  let normalized = withoutComments
    .replaceAll(/\s+/gu, ' ')
    .replaceAll(/\(\s+/gu, '(')
    .replaceAll(/\s+\)/gu, ')')
    .trim()

  for (let [index, string_] of stringLiterals.entries()) {
    normalized = normalized.replace(`__STRING_LITERAL_${index}__`, string_)
  }

  return normalized
}
