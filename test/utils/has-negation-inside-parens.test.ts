import { describe, expect, it } from 'vitest'

import { hasNegationInsideParens } from '../../utils/has-negation-inside-parens'
import { inspectNode } from '../helpers/inspect-node'

describe('hasNegationInsideParens', () => {
  it.each([
    { group: 'a group of a single negated operand', code: 'x = !(!a)' },
    { group: 'a conjunction with a negated operand', code: 'x = !(!a && b)' },
    {
      group: 'negated operands on both sides',
      code: 'x = !(!a || !b)',
    },
    {
      group: 'a nested group with a negated operand',
      code: 'x = !((!a && b) || c)',
    },
    {
      group: 'a double negation and a negation',
      code: 'x = !(a && !!b && !c)',
    },
    { group: 'a negated unary minus', code: 'x = !(a && !-b)' },
  ])('should find a negation inside $group', ({ code }) => {
    expect.assertions(1)

    let result = inspectNode(code, 'UnaryExpression', hasNegationInsideParens)

    expect(result).toBe(true)
  })

  it.each([
    { group: 'a group without negations', code: 'x = !(a && b)' },
    {
      group: 'a nested group without negations',
      code: 'x = !((a && b) || c)',
    },
    {
      group: 'a group with only a double negation',
      code: 'x = !(a && !!b)',
    },
    {
      group: 'a double negation under a unary minus',
      code: 'x = !(a && -!!b)',
    },
  ])('should not find a negation inside $group', ({ code }) => {
    expect.assertions(1)

    let result = inspectNode(code, 'UnaryExpression', hasNegationInsideParens)

    expect(result).toBe(false)
  })

  it('should not find a negation inside an identifier', () => {
    expect.assertions(1)

    let result = inspectNode('x = a', 'Identifier[name="a"]', (node, context) =>
      hasNegationInsideParens(node, context),
    )

    expect(result).toBe(false)
  })
})
