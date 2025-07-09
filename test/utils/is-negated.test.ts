import type { BinaryExpression, UnaryExpression, Node } from 'estree'

import { describe, expect, it } from 'vitest'

import { isNegated } from '../../utils/is-negated'

describe('isNegated', () => {
  it('should return true for a UnaryExpression with operator "!"', () => {
    expect.assertions(1)

    let node: Node = {
      argument: { type: 'Identifier', name: 'a' },
      type: 'UnaryExpression',
      operator: '!',
      prefix: true,
    } as UnaryExpression

    expect(isNegated(node)).toBeTruthy()
  })

  it('should return false for a UnaryExpression with a different operator', () => {
    expect.assertions(1)

    let node: Node = {
      argument: { type: 'Literal', value: 42 },
      type: 'UnaryExpression',
      operator: '-',
      prefix: true,
    }

    expect(isNegated(node)).toBeFalsy()
  })

  it('should return false for a node that is not a UnaryExpression', () => {
    expect.assertions(1)

    let node: Node = {
      right: { type: 'Literal', value: 2 },
      left: { type: 'Literal', value: 1 },
      type: 'BinaryExpression',
      operator: '+',
    } as BinaryExpression

    expect(isNegated(node)).toBeFalsy()
  })

  it('should return false for a double negation (e.g., !!a)', () => {
    expect.assertions(1)

    let node: Node = {
      argument: {
        argument: { type: 'Identifier', name: 'a' },
        type: 'UnaryExpression',
        operator: '!',
        prefix: true,
      },
      type: 'UnaryExpression',
      operator: '!',
      prefix: true,
    } as UnaryExpression
    expect(isNegated(node)).toBeFalsy()
  })
})
