import type { Expression } from 'estree'

import { describe, expect, it } from 'vitest'

import { isBinaryExpression } from '../../utils/is-binary-expression'

describe('isBinaryExpression', () => {
  it('should return true for a node of type BinaryExpression', () => {
    expect.assertions(1)

    let binaryNode = {
      right: { type: 'Identifier', name: 'b' },
      left: { type: 'Identifier', name: 'a' },
      type: 'BinaryExpression',
      operator: '+',
    }
    expect(isBinaryExpression(binaryNode as Expression)).toBeTruthy()
  })

  it('should return false for a node that is not a BinaryExpression', () => {
    expect.assertions(1)

    let nonBinaryNode = {
      type: 'Identifier',
      name: 'a',
    }
    expect(isBinaryExpression(nonBinaryNode as Expression)).toBeFalsy()
  })
})
