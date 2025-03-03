/**
 * Wraps a string in parentheses.
 *
 * @param {string} text - The string to wrap.
 * @param {boolean} [condition] - Whether to apply the wrapping.
 * @returns {string} The string, wrapped in parentheses if condition is true.
 */
export let parenthesize = (text: string, condition: boolean = true): string =>
  condition ? `(${text})` : text
