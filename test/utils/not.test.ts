import { describe, expect, it } from 'vitest'

import { not } from '../../utils/not'

describe('not', () => {
  it('should return true when the predicate returns false', () => {
    let isFalse = not(() => false)
    expect(isFalse()).toBeTruthy()
  })

  it('should return false when the predicate returns true', () => {
    let isTrue = not(() => true)
    expect(isTrue()).toBeFalsy()
  })

  it('should work with single-argument predicates', () => {
    let isEven = (x: number): boolean => x % 2 === 0
    let isNotEven = not(isEven)

    expect(isNotEven(2)).toBeFalsy()
    expect(isNotEven(3)).toBeTruthy()
  })

  it('should work with multi-argument predicates', () => {
    let isGreater = (a: number, b: number): boolean => a > b
    let isNotGreater = not(isGreater)

    expect(isNotGreater(5, 3)).toBeFalsy()
    expect(isNotGreater(2, 3)).toBeTruthy()
  })
})
