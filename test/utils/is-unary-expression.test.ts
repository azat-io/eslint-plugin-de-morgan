import type { Expression } from 'estree'

import { describe, expect, it } from 'vitest'

import { isUnaryExpression } from '../../utils/is-unary-expression'

describe('isUnaryExpression', () => {
  it('should return true for a node of type UnaryExpression', () => {
    let unaryNode = {
      argument: { type: 'Identifier', name: 'a' },
      type: 'UnaryExpression',
      operator: '!',
      prefix: true,
    }
    expect(isUnaryExpression(unaryNode as Expression)).toBeTruthy()
  })

  it('should return false for a node that is not a UnaryExpression', () => {
    let nonUnaryNode = {
      type: 'Identifier',
      name: 'a',
    }
    expect(isUnaryExpression(nonUnaryNode as Expression)).toBeFalsy()
  })
})
