/**
 * Wraps a string in parentheses.
 *
 * @param text - The string to wrap.
 * @param [condition] - Whether to apply the wrapping.
 * @returns The string, wrapped in parentheses if condition is true.
 */
export function parenthesize(text: string, condition: boolean = true): string {
  return condition ? `(${text})` : text
}
