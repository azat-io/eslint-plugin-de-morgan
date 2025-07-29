import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { sanitizeCode } from '../../utils/sanitize-code'

describe('sanitizeCode', () => {
  it('should remove extra spaces and newlines', () => {
    expect.assertions(1)

    let input = dedent`
      Hello    world
      this   is a    test.
    `
    let expected = 'Hello world this is a test.'
    expect(sanitizeCode(input)).toBe(expected)
  })

  it('should trim leading and trailing whitespace', () => {
    expect.assertions(1)

    let input = '   Hello world    '
    let expected = 'Hello world'
    expect(sanitizeCode(input)).toBe(expected)
  })

  it('should collapse multiple spaces into one', () => {
    expect.assertions(1)

    let input = 'Hello      world'
    let expected = 'Hello world'
    expect(sanitizeCode(input)).toBe(expected)
  })

  it('should handle strings with only whitespace and newlines', () => {
    expect.assertions(1)

    let input = '  \n'
    let expected = ''
    expect(sanitizeCode(input)).toBe(expected)
  })

  it('should return the same string if no extra whitespace is present', () => {
    expect.assertions(1)

    let input = 'Hello world'
    let expected = 'Hello world'
    expect(sanitizeCode(input)).toBe(expected)
  })

  it('should remove single-line comments', () => {
    expect.assertions(1)

    let input = 'const x = 5; // This is a comment'
    let expected = 'const x = 5;'
    expect(sanitizeCode(input)).toBe(expected)
  })

  it('should remove multi-line comments', () => {
    expect.assertions(1)

    let input = 'const x = /* This is a comment */ 5;'
    let expected = 'const x = 5;'
    expect(sanitizeCode(input)).toBe(expected)
  })

  it('should remove multi-line comments that span multiple lines', () => {
    expect.assertions(1)

    let input = dedent`
      const x = 5;
      /* This is a comment
         that spans multiple
         lines */
      const y = 10;
    `
    let expected = 'const x = 5; const y = 10;'
    expect(sanitizeCode(input)).toBe(expected)
  })

  it('should handle code with both single and multi-line comments', () => {
    expect.assertions(1)

    let input = dedent`
      const x = 5; // First variable
      /* Explanation for y:
         - It's important
         - It's the second variable
      */
      const y = /* inline */ 10; // Second variable
    `
    let expected = 'const x = 5; const y = 10;'
    expect(sanitizeCode(input)).toBe(expected)
  })

  it('should handle nested comments correctly', () => {
    expect.assertions(1)

    let input = 'const x = /* outer /* inner */ comment */ 5;'
    let expected = 'const x = comment */ 5;'
    expect(sanitizeCode(input)).toBe(expected)
  })

  it('should handle comments inside string literals', () => {
    expect.assertions(1)

    let input = 'const str = "This is not a // comment";'
    let expected = 'const str = "This is not a // comment";'
    expect(sanitizeCode(input)).toBe(expected)
  })

  it('should correctly handle code with De Morgan operators and comments', () => {
    expect.assertions(1)

    let input = '!(a && /* important */ b)'
    let expected = '!(a && b)'
    expect(sanitizeCode(input)).toBe(expected)
  })
})
