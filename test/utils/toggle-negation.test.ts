import type { BinaryExpression, Expression, Node } from 'estree'

import { describe, expect, it } from 'vitest'

import { createFakeContext } from '../helpers/create-fake-context'
import { toggleNegation } from '../../utils/toggle-negation'
import { inspectNode } from '../helpers/inspect-node'

interface FakeOperatorToken {
  range: [number, number]
  value: string
}

type FakeNode = {
  tokenAfter?: FakeOperatorToken
  raw: string
} & Node

let fakeContext = createFakeContext({
  getTokenAfter: (node: FakeNode) => node.tokenAfter ?? null,
  getText: (node: FakeNode) => node.raw,
})

function toggleOperand(code: string, selector: string): string {
  return inspectNode(code, selector, (node, context) =>
    toggleNegation(node as Expression, context),
  )
}

describe('toggleNegation', () => {
  it.each([
    { operand: 'a strict equality', code: 'f(a === b)', output: 'a !== b' },
    { operand: 'a strict inequality', code: 'f(a !== b)', output: 'a === b' },
    { operand: 'a loose equality', code: 'f(a == b)', output: 'a != b' },
    { operand: 'a loose inequality', code: 'f(a != b)', output: 'a == b' },
  ])('should toggle the operator of $operand', ({ output, code }) => {
    expect.assertions(1)

    let result = toggleOperand(code, 'BinaryExpression')

    expect(result).toBe(output)
  })

  it.each([
    { operand: 'a less-than comparison', output: '!(a < b)', code: 'f(a < b)' },
    {
      operand: 'a greater-than comparison',
      output: '!(a > b)',
      code: 'f(a > b)',
    },
    {
      operand: 'a less-or-equal comparison',
      output: '!(a <= b)',
      code: 'f(a <= b)',
    },
    {
      operand: 'a greater-or-equal comparison',
      output: '!(a >= b)',
      code: 'f(a >= b)',
    },
    { operand: 'an in check', output: '!(a in b)', code: 'f(a in b)' },
  ])(
    'should wrap $operand in a negation instead of toggling it',
    ({ output, code }) => {
      expect.assertions(1)

      let result = toggleOperand(code, 'BinaryExpression')

      expect(result).toBe(output)
    },
  )

  it.each([
    {
      selector: 'ConditionalExpression',
      operand: 'a conditional',
      output: '!(b ? c : d)',
      code: 'f(b ? c : d)',
    },
    {
      selector: 'ArrowFunctionExpression',
      operand: 'an arrow function',
      output: '!(x => x)',
      code: 'f(x => x)',
    },
    {
      selector: 'AssignmentExpression',
      operand: 'an assignment',
      output: '!(b = c)',
      code: 'f(b = c)',
    },
    {
      selector: 'SequenceExpression',
      operand: 'a sequence',
      output: '!(b, c)',
      code: 'f((b, c))',
    },
    {
      operand: 'a sequence that starts with a negation',
      selector: 'SequenceExpression',
      output: '!(!b, c)',
      code: 'f((!b, c))',
    },
    {
      code: 'function* g() { f(yield) }',
      selector: 'YieldExpression',
      operand: 'a yield',
      output: '!(yield)',
    },
    {
      selector: 'LogicalExpression',
      operand: 'a conjunction',
      output: '!(a && b)',
      code: 'f(a && b)',
    },
    {
      selector: 'LogicalExpression',
      operand: 'a disjunction',
      output: '!(a || b)',
      code: 'f(a || b)',
    },
  ])('should wrap $operand in a negation', ({ selector, output, code }) => {
    expect.assertions(1)

    let result = toggleOperand(code, selector)

    expect(result).toBe(output)
  })

  it('should remove the negation of a negated operand', () => {
    expect.assertions(1)

    let result = toggleOperand('f(!a)', 'UnaryExpression')

    expect(result).toBe('a')
  })

  it.each([
    {
      selector: 'UnaryExpression',
      operand: 'a bitwise NOT',
      output: '!~a',
      code: 'f(~a)',
    },
    {
      selector: 'Identifier[name="a"]',
      operand: 'an identifier',
      output: '!a',
      code: 'f(a)',
    },
  ])('should add a negation to $operand', ({ selector, output, code }) => {
    expect.assertions(1)

    let result = toggleOperand(code, selector)

    expect(result).toBe(output)
  })

  it.each([
    { output: 'false', code: 'f(true)', literal: 'true' },
    { code: 'f(false)', literal: 'false', output: 'true' },
  ])('should replace $literal with its opposite', ({ output, code }) => {
    expect.assertions(1)

    let result = toggleOperand(code, 'Literal')

    expect(result).toBe(output)
  })

  it('should wrap an equality in a negation when its operator token cannot be located', () => {
    expect.assertions(1)

    let node = {
      right: { type: 'Identifier', name: 'b', raw: 'b' },
      left: { type: 'Identifier', name: 'a', raw: 'a' },
      type: 'BinaryExpression',
      operator: '===',
      raw: 'a === b',
      range: [0, 7],
    } as BinaryExpression & FakeNode

    let result = toggleNegation(node, fakeContext)

    expect(result).toBe('!(a === b)')
  })

  it('should wrap an equality in a negation when its range is missing', () => {
    expect.assertions(1)

    let node = {
      left: {
        tokenAfter: { range: [2, 5], value: '===' },
        type: 'Identifier',
        name: 'a',
        raw: 'a',
      },
      right: { type: 'Identifier', name: 'b', raw: 'b' },
      type: 'BinaryExpression',
      operator: '===',
      raw: 'a === b',
    } as BinaryExpression & FakeNode

    let result = toggleNegation(node, fakeContext)

    expect(result).toBe('!(a === b)')
  })
})
