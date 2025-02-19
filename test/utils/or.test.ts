import { describe, expect, it } from 'vitest'

import { or } from '../../utils/or'

describe('or', () => {
  it('should return false when all predicates return false', () => {
    let isFalse = or(
      () => false,
      () => false,
    )
    expect(isFalse()).toBeFalsy()
  })

  it('should return true when at least one predicate returns true', () => {
    let hasTrue = or(
      () => false,
      () => true,
    )
    expect(hasTrue()).toBeTruthy()
  })

  it('should return true when the first predicate is true', () => {
    let firstTrue = or(
      () => true,
      () => false,
    )
    expect(firstTrue()).toBeTruthy()
  })

  it('should return true when the last predicate is true', () => {
    let lastTrue = or(
      () => false,
      () => false,
      () => true,
    )
    expect(lastTrue()).toBeTruthy()
  })

  it('should work with single-argument predicates', () => {
    let isEven = (x: number): boolean => x % 2 === 0
    let isNegative = (x: number): boolean => x < 0
    let isEvenOrNegative = or(isEven, isNegative)

    expect(isEvenOrNegative(2)).toBeTruthy()
    expect(isEvenOrNegative(-3)).toBeTruthy()
    expect(isEvenOrNegative(3)).toBeFalsy()
  })

  it('should work with multi-argument predicates', () => {
    let isGreater = (a: number, b: number): boolean => a > b
    let isEqual = (a: number, b: number): boolean => a === b
    let isGreaterOrEqual = or(isGreater, isEqual)

    expect(isGreaterOrEqual(5, 3)).toBeTruthy()
    expect(isGreaterOrEqual(3, 3)).toBeTruthy()
    expect(isGreaterOrEqual(2, 3)).toBeFalsy()
    expect(isGreaterOrEqual(5, 5)).toBeTruthy()
  })
})
