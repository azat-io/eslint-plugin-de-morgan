import { describe, expect, it } from 'vitest'

import { isInTruthinessContext } from '../../utils/is-in-truthiness-context'
import { inspectNegatedGroup, inspectNode } from '../helpers/inspect-node'

describe('isInTruthinessContext', () => {
  it.each([
    { position: 'an if condition', code: 'if (!(a && b)) {}' },
    { position: 'a while condition', code: 'while (!(a && b)) {}' },
    { position: 'a do-while condition', code: 'do {} while (!(a && b))' },
    { code: 'for (; !(a && b); ) {}', position: 'a for condition' },
    { position: 'a conditional test', code: 'x = !(a && b) ? 1 : 0' },
    { position: 'a branch of a condition', code: 'if (c ? !(a && b) : d) {}' },
    { position: 'an expression statement', code: '!(a && b)' },
    { position: 'the argument of a negation', code: 'x = !!(a && b)' },
    { position: 'a discarded sequence value', code: 'x = (!(a && b), c)' },
    { position: 'a middle sequence value', code: 'x = (c, !(a && b), d)' },
    {
      position: 'the last sequence value of a condition',
      code: 'if ((c, !(a && b))) {}',
    },
    {
      position: 'a disjunction operand in a condition',
      code: 'if (!(a && b) || c) {}',
    },
    {
      position: 'a conjunction operand in a condition',
      code: 'if (c && !(a && b)) {}',
    },
  ])('should treat $position as a truthiness context', ({ code }) => {
    expect.assertions(1)

    let result = inspectNegatedGroup(code, isInTruthinessContext)

    expect(result).toBe(true)
  })

  it.each([
    { position: 'an assigned value', code: 'x = !(a && b)' },
    {
      position: 'a branch of an assigned value',
      code: 'x = c ? !(a && b) : d',
    },
    {
      position: 'the assigned last sequence value',
      code: 'x = (c, !(a && b))',
    },
    { position: 'an assigned disjunction operand', code: 'x = !(a && b) || c' },
    {
      position: 'a nullish coalescing operand',
      code: 'if (!(a && b) ?? c) {}',
    },
    { code: 'if (!(a && b) === c) {}', position: 'a compared value' },
    { position: 'the argument of a unary minus', code: 'x = -!(a && b)' },
    { position: 'a function argument', code: 'f(!(a && b))' },
    { code: 'function f() { return !(a && b) }', position: 'a returned value' },
  ])('should not treat $position as a truthiness context', ({ code }) => {
    expect.assertions(1)

    let result = inspectNegatedGroup(code, isInTruthinessContext)

    expect(result).toBe(false)
  })

  it('should not treat a node without a parent as a truthiness context', () => {
    expect.assertions(1)

    let result = inspectNode('a', 'Program', isInTruthinessContext)

    expect(result).toBe(false)
  })
})
