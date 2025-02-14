import type { UnaryExpression, Expression } from 'estree'

import { describe, expect, it } from 'vitest'

import { hasNegationOperator } from '../../utils/has-negation-operator'

describe('hasNegationOperator', () => {
  it('should return true for a UnaryExpression with operator "!"', () => {
    let node: Expression = {
      argument: { type: 'Identifier', name: 'a' },
      type: 'UnaryExpression',
      operator: '!',
      prefix: true,
    } as UnaryExpression
    expect(hasNegationOperator(node)).toBeTruthy()
  })

  it('should return false for a UnaryExpression with a different operator', () => {
    let node: Expression = {
      argument: { type: 'Literal', value: 42 },
      type: 'UnaryExpression',
      operator: '-',
      prefix: true,
    } as UnaryExpression
    expect(hasNegationOperator(node)).toBeFalsy()
  })

  it('should return false for a non-UnaryExpression node', () => {
    let node: Expression = {
      type: 'Identifier',
      name: 'a',
    }
    expect(hasNegationOperator(node)).toBeFalsy()
  })
})
