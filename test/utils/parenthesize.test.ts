import { describe, expect, it } from 'vitest'

import { parenthesize } from '../../utils/parenthesize'

describe('parenthesize', () => {
  it('wraps a string in parentheses', () => {
    expect(parenthesize('foo')).toBe('(foo)')
  })

  it('does not wrap a string in parentheses if condition is false', () => {
    expect(parenthesize('foo', false)).toBe('foo')
  })
})
