import type { Node } from 'estree'

import { describe, expect, it } from 'vitest'

import { inspectNegatedGroup, inspectNode } from '../helpers/inspect-node'
import { hasBooleanContext } from '../../utils/has-boolean-context'

describe('hasBooleanContext', () => {
  it.each([
    { position: 'an if condition', code: 'if (!(a && b)) {}' },
    { position: 'a while condition', code: 'while (!(a && b)) {}' },
    { code: 'for (; !(a && b); ) {}', position: 'a for condition' },
    { position: 'a do-while condition', code: 'do {} while (!(a && b))' },
    { position: 'a conditional test', code: 'x = !(a && b) ? 1 : 0' },
    { position: 'an operand of a conjunction', code: 'x = !(a && b) && c' },
    { position: 'an operand of a disjunction', code: 'x = !(a && b) || c' },
    { position: 'the argument of a negation', code: 'x = !!(a && b)' },
    { position: 'a strict equality operand', code: 'x = !(a && b) === c' },
    { position: 'a strict inequality operand', code: 'x = !(a && b) !== c' },
    { position: 'a loose equality operand', code: 'x = !(a && b) == c' },
    { position: 'a loose inequality operand', code: 'x = !(a && b) != c' },
    { position: 'a less-than operand', code: 'x = !(a && b) < c' },
    { position: 'a greater-than operand', code: 'x = !(a && b) > c' },
    { position: 'a less-or-equal operand', code: 'x = !(a && b) <= c' },
    { position: 'a greater-or-equal operand', code: 'x = !(a && b) >= c' },
    { position: 'the key of an in check', code: 'x = !(a && b) in c' },
    {
      position: 'the subject of an instanceof check',
      code: 'x = !(a && b) instanceof C',
    },
    { position: 'a Boolean call argument', code: 'x = Boolean(!(a && b))' },
  ])('should find a boolean context in $position', ({ code }) => {
    expect.assertions(1)

    let result = inspectNegatedGroup(code, hasBooleanContext)

    expect(result).toBeTruthy()
  })

  it.each([
    { position: 'an operand of an addition', code: 'x = !(a && b) + c' },
    {
      position: 'a non-Boolean function argument',
      code: 'x = someFunction(!(a && b))',
    },
    { position: 'a computed member key', code: 'x = obj[!(a && b)]' },
    {
      position: 'an argument of a method named Boolean',
      code: 'x = obj.Boolean(!(a && b))',
    },
  ])('should not find a boolean context in $position', ({ code }) => {
    expect.assertions(1)

    let result = inspectNegatedGroup(code, hasBooleanContext)

    expect(result).toBeFalsy()
  })

  it('should not find a boolean context for a node without a parent', () => {
    expect.assertions(1)

    let result = inspectNode('a', 'Program', (node, context) =>
      hasBooleanContext(node as Node, context),
    )

    expect(result).toBeFalsy()
  })
})
