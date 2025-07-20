import { describe, expect, it } from 'vitest'

import { applyToProperty } from '../../utils/apply-to-property'

describe('applyToProperty', () => {
  it('should apply the predicate to the specified property', () => {
    expect.assertions(1)

    function isPositive(x: number): boolean {
      return x > 0
    }

    let object = { value: 10 }

    let testValue = applyToProperty('value', isPositive)

    expect(testValue(object)).toBeTruthy()
  })

  it('should return false if the predicate returns false', () => {
    expect.assertions(1)

    function isNonEmpty(string_: string): boolean {
      return string_.length > 0
    }

    let object = { name: '' }

    let testName = applyToProperty('name', isNonEmpty)

    expect(testName(object)).toBeFalsy()
  })

  it('should work with different property types', () => {
    expect.assertions(1)

    let isTruthy = Boolean
    let object = { flag: false }

    let testFlag = applyToProperty('flag', isTruthy)

    expect(testFlag(object)).toBeFalsy()
  })
})
