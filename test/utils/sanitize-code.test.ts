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

  it.each([
    { literal: 'a string with a replacement pattern', input: "b === '$&'" },
    { literal: 'a string with an escaped dollar sign', input: "b === '$$'" },
    { literal: 'a string with a suffix pattern', input: 'b === "$\'"' },
    {
      literal: 'a template with a dollar sign before an interpolation',
      // eslint-disable-next-line no-template-curly-in-string
      input: 'b === `$${c}`',
    },
    {
      literal: 'a regular expression with two slashes',
      input: String.raw`a && /^https?:\/\//.test(b)`,
    },
    {
      literal: 'a string next to an identifier that looks like a placeholder',
      input: "__STRING_LITERAL_0__ && b === 'x'",
    },
    {
      literal: 'a regular expression after a division',
      input: 'b / /a  b/.test(a)',
    },
    {
      literal: 'a string with escapes and spaces inside',
      input: String.raw`b === 'it\'s  a\  b'`,
    },
    {
      literal: 'a template with escapes and spaces inside',
      input: 'b === `it\\`s  a\\  b`',
    },
    {
      literal: 'a string with spaces before an escaped quote',
      input: String.raw`b === 'a  \'b'`,
    },
    {
      literal: 'a template with spaces before an escaped backtick',
      input: 'b === `a  \\`b`',
    },
    {
      literal: 'a regular expression with spaces inside',
      input: String.raw`a && /[ab  c]  d\/  e/g.test(b)`,
    },
  ])('should keep $literal verbatim', ({ input }) => {
    expect.assertions(1)

    expect(sanitizeCode(input)).toBe(input)
  })

  it.each([
    { input: 'instanceof /a  b/', keyword: 'instanceof' },
    { input: 'typeof /a  b/', keyword: 'typeof' },
    { input: 'delete /a  b/', keyword: 'delete' },
    { input: 'return /a  b/', keyword: 'return' },
    { input: 'await /a  b/', keyword: 'await' },
    { input: 'throw /a  b/', keyword: 'throw' },
    { input: 'yield /a  b/', keyword: 'yield' },
    { input: 'case /a  b/', keyword: 'case' },
    { input: 'else /a  b/', keyword: 'else' },
    { input: 'void /a  b/', keyword: 'void' },
    { input: 'do /a  b/', keyword: 'do' },
    { input: 'in /a  b/', keyword: 'in' },
  ])(
    'should keep a regular expression after $keyword verbatim',
    ({ input }) => {
      expect.assertions(1)

      expect(sanitizeCode(input)).toBe(input)
    },
  )

  it('should not take a comment start inside a regular expression for a comment', () => {
    expect.assertions(1)

    let input = String.raw`/\/*x/.test(a) && b /* c */`
    let expected = String.raw`/\/*x/.test(a) && b`
    expect(sanitizeCode(input)).toBe(expected)
  })

  it.each([
    {
      comment: 'block comments with apostrophes',
      input: "a /* it's */ && /* that's */ b",
      expected: 'a && b',
    },
    {
      comment: 'a line comment with an apostrophe',
      input: "a && // don't\n  b === 'x'",
      expected: "a && b === 'x'",
    },
    {
      comment: 'a comment between two words',
      input: 'typeof/* note */a',
      expected: 'typeof a',
    },
    {
      comment: 'a comment full of stars',
      input: 'a /* a **b * c **/ && b',
      expected: 'a && b',
    },
  ])('should replace $comment with a single space', ({ expected, input }) => {
    expect.assertions(1)

    expect(sanitizeCode(input)).toBe(expected)
  })

  it('should keep a regular expression after a line comment verbatim', () => {
    expect.assertions(1)

    let input = 'a && // must be a link\n/^https?:\\/\\//.test(b)'
    let expected = String.raw`a && /^https?:\/\//.test(b)`
    expect(sanitizeCode(input)).toBe(expected)
  })

  it.each([
    { input: 'a  /  b  /  c', expected: 'a / b / c', operand: 'a word' },
    {
      operand: 'a closing parenthesis',
      input: '(a)  /  b  /  c',
      expected: '(a) / b / c',
    },
    {
      operand: 'a closing bracket',
      input: 'a[0]  /  b  /  c',
      expected: 'a[0] / b / c',
    },
    {
      operand: 'a closing brace',
      input: '{}  /  b  /  c',
      expected: '{} / b / c',
    },
    { input: "'x'  /  b  /  c", expected: "'x' / b / c", operand: 'a string' },
  ])(
    'should not take a slash after $operand for a regular expression',
    ({ expected, input }) => {
      expect.assertions(1)

      expect(sanitizeCode(input)).toBe(expected)
    },
  )

  it.each([
    {
      parenthesis: 'an opening parenthesis',
      input: '!( /* c */ a)',
      expected: '!(a)',
    },
    {
      parenthesis: 'a closing parenthesis',
      input: '!(a /* c */ )',
      expected: '!(a)',
    },
  ])(
    'should drop whitespace and comments next to $parenthesis',
    ({ expected, input }) => {
      expect.assertions(1)

      expect(sanitizeCode(input)).toBe(expected)
    },
  )
})
