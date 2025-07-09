import { describe, expect, it } from 'vitest'

import { createTestWithParameters } from '../../utils/create-test-with-parameters'

describe('createTestWithParams', () => {
  it('should return true when all predicates return true', () => {
    expect.assertions(1)

    let test = createTestWithParameters(3)
    let predicates = [
      (x: number) => x > 0,
      (x: number) => x < 10,
      (x: number) => x !== 5,
    ]

    expect(test(...predicates)).toBeTruthy()
  })

  it('should return false when at least one predicate returns false', () => {
    expect.assertions(1)

    let test = createTestWithParameters(3)
    let predicates = [
      (x: number) => x > 0,
      (x: number) => x < 10,
      (x: number) => x === 5,
    ]

    expect(test(...predicates)).toBeFalsy()
  })

  it('should return true for an empty array of predicates', () => {
    expect.assertions(1)

    let test = createTestWithParameters(42)
    expect(test()).toBeTruthy()
  })

  it('should stop execution on the first false result', () => {
    expect.assertions(2)

    let callCount = 0
    let test = createTestWithParameters(3)
    let predicates = [
      (x: number) => {
        callCount++
        return x > 0
      },
      (x: number) => {
        callCount++
        return x < 10
      },
      (x: number) => {
        callCount++
        return x === 5
      },
      (x: number) => {
        callCount++
        return x > 2
      },
    ]

    expect(test(...predicates)).toBeFalsy()
    expect(callCount).toBe(3)
  })

  it('should work with multiple parameters', () => {
    expect.assertions(2)

    let test = createTestWithParameters(3, 4)
    let predicates = [
      (x: number, y: number) => x + y > 0,
      (x: number, y: number) => x * y < 100,
    ]

    expect(test(...predicates)).toBeTruthy()
    expect(createTestWithParameters(-3, -4)(...predicates)).toBeFalsy()
  })
})
