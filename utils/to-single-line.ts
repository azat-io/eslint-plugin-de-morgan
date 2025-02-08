/**
 * Converts a string to a single line by removing all extra spaces and new
 * lines. It is helpful for error messages.
 * @param {string} string - The string to convert.
 * @returns {string} The single line string.
 */
export let toSingleLine = (string: string): string =>
  string.replaceAll(/\s+/gu, ' ').trim()
