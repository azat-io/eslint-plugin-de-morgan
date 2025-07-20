import { describe, expect, it } from 'vitest'

import { not } from '../../utils/not'

describe('not', () => {
  it('should return true when the predicate returns false', () => {
    expect.assertions(1)

    let isFalse = not(() => false)
    expect(isFalse()).toBeTruthy()
  })

  it('should return false when the predicate returns true', () => {
    expect.assertions(1)

    let isTrue = not(() => true)
    expect(isTrue()).toBeFalsy()
  })

  it('should work with single-argument predicates', () => {
    expect.assertions(2)

    function isEven(x: number): boolean {
      return x % 2 === 0
    }

    let isNotEven = not(isEven)

    expect(isNotEven(2)).toBeFalsy()
    expect(isNotEven(3)).toBeTruthy()
  })

  it('should work with multi-argument predicates', () => {
    expect.assertions(2)

    function isGreater(a: number, b: number): boolean {
      return a > b
    }

    let isNotGreater = not(isGreater)

    expect(isNotGreater(5, 3)).toBeFalsy()
    expect(isNotGreater(2, 3)).toBeTruthy()
  })
})
