import type { LogicalExpression, UnaryExpression, Expression } from 'estree'
import type { Rule } from 'eslint'

import { describe, expect, it } from 'vitest'

import { hasNegationInsideParentheses } from '../../utils/has-negation-inside-parentheses'

interface FakeLogicalExpression extends LogicalExpression {
  right: Expression
  left: Expression
  code: string
}

interface FakeUnaryExpression extends UnaryExpression {
  argument: Expression
  code: string
}

type FakeNode = {
  range: [number, number]
  parent?: FakeNode
  code?: string
} & Expression

let fakeContext: Rule.RuleContext = {
  sourceCode: {
    getText: (node: { code?: string }) => node.code ?? '',
  },
} as unknown as Rule.RuleContext

let createNegation = (
  argument: Expression,
  code: string,
): FakeUnaryExpression => ({
  type: 'UnaryExpression',
  range: [0, code.length],
  operator: '!',
  prefix: true,
  argument,
  code,
})

let createLogicalExpression = ({
  operator,
  right,
  left,
  code,
}: {
  operator: '&&' | '||'
  right: Expression
  left: Expression
  code: string
}): FakeLogicalExpression => ({
  type: 'LogicalExpression',
  range: [0, code.length],
  operator,
  right,
  left,
  code,
})

let createIdentifier = (name: string): FakeNode => ({
  range: [0, name.length],
  type: 'Identifier',
  code: name,
  name,
})

describe('hasNegationInsideParentheses', () => {
  it('should return true when a negation exists inside parentheses', () => {
    let node = createNegation(createIdentifier('a'), '!a')
    let wrappedNode = createNegation(node, '(!(a))')
    expect(hasNegationInsideParentheses(wrappedNode, fakeContext)).toBeTruthy()
  })

  it('should return true when a negation is inside a logical expression in parentheses', () => {
    let negatedNode = createNegation(createIdentifier('a'), '!a')
    let logicalNode = createLogicalExpression({
      right: createIdentifier('b'),
      left: negatedNode,
      code: '(!a && b)',
      operator: '&&',
    })
    let wrappedNode = createNegation(logicalNode, '(!( !a && b ))')
    expect(hasNegationInsideParentheses(wrappedNode, fakeContext)).toBeTruthy()
  })

  it('should return true when negations exist on both sides of a logical expression', () => {
    let leftNegation = createNegation(createIdentifier('a'), '!a')
    let rightNegation = createNegation(createIdentifier('b'), '!b')
    let logicalNode = createLogicalExpression({
      right: rightNegation,
      left: leftNegation,
      code: '(!a || !b)',
      operator: '||',
    })
    let wrappedNode = createNegation(logicalNode, '(!( !a || !b ))')
    expect(hasNegationInsideParentheses(wrappedNode, fakeContext)).toBeTruthy()
  })

  it('should return false when there are no negations inside the expression', () => {
    let logicalNode = createLogicalExpression({
      right: createIdentifier('b'),
      left: createIdentifier('a'),
      code: '(a && b)',
      operator: '&&',
    })
    let wrappedNode = createNegation(logicalNode, '(!(a && b))')
    expect(hasNegationInsideParentheses(wrappedNode, fakeContext)).toBeFalsy()
  })

  it('should return false when the expression is a simple identifier without negation', () => {
    let node = createIdentifier('a')
    expect(hasNegationInsideParentheses(node, fakeContext)).toBeFalsy()
  })

  it('should return false when there are nested logical expressions but no negations', () => {
    let innerNode = createLogicalExpression({
      right: createIdentifier('b'),
      left: createIdentifier('a'),
      code: '(a && b)',
      operator: '&&',
    })
    let outerNode = createLogicalExpression({
      right: createIdentifier('c'),
      code: '((a && b) || c)',
      left: innerNode,
      operator: '||',
    })
    let wrappedNode = createNegation(outerNode, '(!( (a && b) || c ))')
    expect(hasNegationInsideParentheses(wrappedNode, fakeContext)).toBeFalsy()
  })

  it('should return true when there is a negation deep inside a nested logical expression', () => {
    let innerNode = createLogicalExpression({
      left: createNegation(createIdentifier('a'), '!a'),
      right: createIdentifier('b'),
      code: '(!a && b)',
      operator: '&&',
    })
    let outerNode = createLogicalExpression({
      right: createIdentifier('c'),
      code: '((!a && b) || c)',
      left: innerNode,
      operator: '||',
    })
    let wrappedNode = createNegation(outerNode, '(!( (!a && b) || c ))')
    expect(hasNegationInsideParentheses(wrappedNode, fakeContext)).toBeTruthy()
  })
})
