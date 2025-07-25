import { describe, expect, it } from 'vitest'

import { parenthesize } from '../../utils/parenthesize'

describe('parenthesize', () => {
  it('wraps a string in parentheses', () => {
    expect.assertions(1)

    expect(parenthesize('foo')).toBe('(foo)')
  })

  it('wraps a string in parentheses if condition is true', () => {
    expect.assertions(1)

    expect(parenthesize('foo', true)).toBe('(foo)')
  })

  it('does not wrap a string in parentheses if condition is false', () => {
    expect.assertions(1)

    expect(parenthesize('foo', false)).toBe('foo')
  })
})
