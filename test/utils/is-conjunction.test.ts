import type { LogicalExpression, Node } from 'estree'

import { describe, expect, it } from 'vitest'

import { isConjunction } from '../../utils/is-conjunction'

describe('isConjunction', () => {
  it('should return true for a LogicalExpression with operator "&&"', () => {
    let node: Node = {
      right: { type: 'Identifier', name: 'b' },
      left: { type: 'Identifier', name: 'a' },
      type: 'LogicalExpression',
      operator: '&&',
    } as LogicalExpression

    expect(isConjunction(node)).toBeTruthy()
  })

  it('should return false for a LogicalExpression with a different operator', () => {
    let node: Node = {
      right: { type: 'Identifier', name: 'b' },
      left: { type: 'Identifier', name: 'a' },
      type: 'LogicalExpression',
      operator: '||',
    } as LogicalExpression

    expect(isConjunction(node)).toBeFalsy()
  })

  it('should return false for a node that is not a LogicalExpression', () => {
    let node: Node = {
      type: 'Literal',
      value: 42,
    }

    expect(isConjunction(node)).toBeFalsy()
  })
})
