import type { Expression } from 'estree'

import { describe, expect, it } from 'vitest'

import { isBoolean } from '../../utils/is-boolean'

describe('isBoolean', () => {
  it('should return true for a boolean literal', () => {
    let node = { type: 'Literal', value: true } as Expression
    expect(isBoolean(node)).toBeTruthy()
  })

  it('should return false for a non-boolean literal', () => {
    let node = { type: 'Literal', value: 'true' } as Expression
    expect(isBoolean(node)).toBeFalsy()
  })

  it('should return false for a non-literal node', () => {
    let node = { type: 'Identifier', name: 'true' } as Expression
    expect(isBoolean(node)).toBeFalsy()
  })
})
