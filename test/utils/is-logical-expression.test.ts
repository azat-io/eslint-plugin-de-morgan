import type { Expression } from 'estree'

import { describe, expect, it } from 'vitest'

import { isLogicalExpression } from '../../utils/is-logical-expression'

describe('isLogicalExpression', () => {
  it('should return true for a node of type LogicalExpression', () => {
    expect.assertions(1)

    let node = {
      right: { type: 'Identifier', name: 'b' },
      left: { type: 'Identifier', name: 'a' },
      type: 'LogicalExpression',
      operator: '&&',
    }
    expect(isLogicalExpression(node as Expression)).toBeTruthy()
  })

  it('should return false for a node that is not a LogicalExpression', () => {
    expect.assertions(1)

    let node = {
      type: 'Identifier',
      name: 'a',
    }
    expect(isLogicalExpression(node as Expression)).toBeFalsy()
  })
})
