import type { LogicalExpression, Expression, Identifier, Literal } from 'estree'
import type { Rule } from 'eslint'

import { describe, expect, it } from 'vitest'

import { flattenOperands } from '../../utils/flatten-operands'
import { getNodeContent } from '../../utils/get-node-content'

interface FakeLogicalExpression extends LogicalExpression {
  right: Expression
  left: Expression
  code?: string
  raw: string
}

interface FakeIdentifier extends Identifier {
  code?: string
  raw: string
}

type FakeLiteral = { value: string; raw: string } & Literal

type FakeNode = FakeLogicalExpression | FakeIdentifier

let fakeContext: Rule.RuleContext = {
  sourceCode: {
    getText: (node: { raw: string }) => node.raw,
  },
} as unknown as Rule.RuleContext

let isConjunctionFake = (expr: Expression): boolean =>
  expr.type === 'LogicalExpression' && expr.operator === '&&'

let simpleTransformer = (expr: Expression): string =>
  fakeContext.sourceCode.getText(expr)

let createIdentifier = (
  name: string,
  raw: string,
  range: [number, number],
): FakeIdentifier => ({
  type: 'Identifier',
  code: raw,
  range,
  name,
  raw,
})

let createNestedConjunction = (depth: number): FakeNode => {
  let node: FakeNode = createIdentifier('a', 'a', [0, 1])
  for (let i = 0; i < depth; i++) {
    node = {
      right: createIdentifier('a', 'a', [0, 1]),
      type: 'LogicalExpression',
      code: `(a && a)`,
      raw: `(a && a)`,
      operator: '&&',
      range: [0, 7],
      left: node,
    } as FakeLogicalExpression
  }
  return node
}

describe('flattenOperands', () => {
  it('should flatten a simple conjunction', () => {
    let node: FakeLogicalExpression = {
      right: { type: 'Identifier', name: 'b', raw: 'b' } as FakeIdentifier,
      left: { type: 'Identifier', name: 'a', raw: 'a' } as FakeIdentifier,
      type: 'LogicalExpression',
      operator: '&&',
      raw: 'a && b',
    }
    let result = flattenOperands({
      transformer: simpleTransformer,
      predicate: isConjunctionFake,
      context: fakeContext,
      expression: node,
    })
    expect(result).toEqual(['a', 'b'])
  })

  it('should flatten a nested conjunction', () => {
    let node: FakeLogicalExpression = {
      right: {
        right: { type: 'Identifier', name: 'c', raw: 'c' } as FakeIdentifier,
        left: { type: 'Identifier', name: 'b', raw: 'b' } as FakeIdentifier,
        type: 'LogicalExpression',
        operator: '&&',
        raw: 'b && c',
      } as FakeLogicalExpression,
      left: { type: 'Identifier', name: 'a', raw: 'a' } as FakeIdentifier,
      type: 'LogicalExpression',
      raw: 'a && (b && c)',
      operator: '&&',
    }
    let result = flattenOperands({
      transformer: simpleTransformer,
      predicate: isConjunctionFake,
      context: fakeContext,
      expression: node,
    })
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('should return a single element array if expression is not a conjunction', () => {
    let node: FakeLiteral = {
      type: 'Literal',
      value: 'foo',
      raw: 'foo',
    }
    let result = flattenOperands({
      transformer: simpleTransformer,
      predicate: isConjunctionFake,
      context: fakeContext,
      expression: node,
    })
    expect(result).toEqual(['foo'])
  })

  it('should work for a mixed expression when predicate is false', () => {
    let node: FakeIdentifier = {
      type: 'Identifier',
      name: 'x',
      raw: 'x',
    }
    let result = flattenOperands({
      transformer: simpleTransformer,
      predicate: isConjunctionFake,
      context: fakeContext,
      expression: node,
    })
    expect(result).toEqual(['x'])
  })

  it('should stop processing when maximum recursion depth is exceeded', () => {
    let deepExpression = createNestedConjunction(110)
    let result = flattenOperands({
      transformer: (expr: Expression, context: Rule.RuleContext): string =>
        getNodeContent(expr, context).trim(),
      predicate: (expr: Expression): boolean =>
        expr.type === 'LogicalExpression' && expr.operator === '&&',
      expression: deepExpression,
      context: fakeContext,
    })
    expect(result.length).toBeLessThan(110)
  })
})
