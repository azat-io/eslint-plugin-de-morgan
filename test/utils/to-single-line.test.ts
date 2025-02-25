import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { toSingleLine } from '../../utils/to-single-line'

describe('toSingleLine', () => {
  it('should remove extra spaces and newlines', () => {
    let input = `Hello    world
this   is a    test.`
    let expected = 'Hello world this is a test.'
    expect(toSingleLine(input)).toBe(expected)
  })

  it('should trim leading and trailing whitespace', () => {
    let input = '   Hello world    '
    let expected = 'Hello world'
    expect(toSingleLine(input)).toBe(expected)
  })

  it('should collapse multiple spaces into one', () => {
    let input = 'Hello      world'
    let expected = 'Hello world'
    expect(toSingleLine(input)).toBe(expected)
  })

  it('should handle strings with only whitespace and newlines', () => {
    let input = dedent`
        
    `
    let expected = ''
    expect(toSingleLine(input)).toBe(expected)
  })

  it('should return the same string if no extra whitespace is present', () => {
    let input = 'Hello world'
    let expected = 'Hello world'
    expect(toSingleLine(input)).toBe(expected)
  })
})
