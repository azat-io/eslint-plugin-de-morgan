import type { UnaryExpression } from 'estree'
import type { Rule } from 'eslint'

import { describe, expect, it } from 'vitest'

import { needsParentParens } from '../../utils/needs-parent-parens'
import { inspectNegatedGroup } from '../helpers/inspect-node'

describe('needsParentParens', () => {
  it.each([
    { position: 'a member object', code: 'x = (!(a && b)).y' },
    { code: 'x = (!(a && b))()', position: 'a callee' },
    { position: 'a constructor callee', code: 'x = new (!(a && b))()' },
    { position: 'a tagged template tag', code: 'x = (!(a && b))``' },
    {
      code: 'async function f() { await !(a && b) }',
      position: 'an await argument',
    },
    { position: 'an operand of a comparison', code: 'x = !(a && b) === c' },
    { code: 'for (x = !(a && b); ; ) {}', position: 'a for initializer' },
  ])('should wrap a disjunction placed at $position', ({ code }) => {
    expect.assertions(1)

    let result = inspectNegatedGroup(code, node =>
      needsParentParens(node, '||'),
    )

    expect(result).toBe(true)
  })

  it.each([
    { position: 'a computed member key', code: 'x = o[!(a && b)]' },
    { position: 'a call argument', code: 'x = foo(!(a && b))' },
    { position: 'an operand of a disjunction', code: 'x = !(a && b) || c' },
  ])('should not wrap a disjunction placed at $position', ({ code }) => {
    expect.assertions(1)

    let result = inspectNegatedGroup(code, node =>
      needsParentParens(node, '||'),
    )

    expect(result).toBe(false)
  })

  it('should not wrap a conjunction placed as an operand of a conjunction', () => {
    expect.assertions(1)

    let result = inspectNegatedGroup('x = !(a || b) && c', node =>
      needsParentParens(node, '&&'),
    )

    expect(result).toBe(false)
  })

  it('should wrap a comparison operand whose parent chain has no statement', () => {
    expect.assertions(1)

    let node = {
      parent: { type: 'BinaryExpression', operator: '===' },
      argument: { type: 'Identifier', name: 'a' },
      type: 'UnaryExpression',
      operator: '!',
      prefix: true,
    } as Rule.NodeParentExtension & UnaryExpression

    let result = needsParentParens(node, '||')

    expect(result).toBe(true)
  })
})
