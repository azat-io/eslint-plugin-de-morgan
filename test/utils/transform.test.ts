import type { LogicalExpression, UnaryExpression, Identifier } from 'estree'
import type { Rule } from 'eslint'

import { describe, expect, it } from 'vitest'

import { transform } from '../../utils/transform'

type FakeNode = {
  parent: FakeNode | null
  raw?: string
  id?: string
} & (LogicalExpression | UnaryExpression | Identifier)

type FakeLogicalExpression = {
  right: FakeNode
  left: FakeNode
  raw: string
} & LogicalExpression &
  FakeNode

type FakeUnaryExpression = {
  argument: FakeNode
  raw: string
} & UnaryExpression &
  FakeNode

type FakeIdentifier = {
  raw: string
} & Identifier &
  FakeNode

let createFakeContext = (sourceText: string): Rule.RuleContext => {
  let sourceMap = new Map<string, string>()

  let fakeSourceCode = {
    getText: (node: FakeNode): string => {
      if (node.id && sourceMap.has(node.id)) {
        return sourceMap.get(node.id)!
      }
      return node.raw ?? ''
    },
    text: sourceText,
  }

  return {
    getSourceCode: () => fakeSourceCode,
    sourceCode: fakeSourceCode,
  } as unknown as Rule.RuleContext
}

let createUnaryExpression = (
  argument: FakeNode,
  parent: FakeNode | null = null,
): FakeUnaryExpression => ({
  range: [0, argument.range ? argument.range[1] + 1 : 1],
  raw: `!(${argument.raw})`,
  type: 'UnaryExpression',
  operator: '!',
  prefix: true,
  id: 'unary',
  argument,
  parent,
})

let createConjunction = (
  left: FakeNode,
  right: FakeNode,
  formattingBetween: string = ' && ',
): FakeLogicalExpression => {
  let leftText = left.raw ?? ''
  let rightText = right.raw ?? ''

  return {
    range: [
      left.range ? left.range[0] : 0,
      right.range
        ? right.range[1]
        : leftText.length + formattingBetween.length + rightText.length,
    ],
    raw: `${leftText}${formattingBetween}${rightText}`,
    type: 'LogicalExpression',
    id: 'conjunction',
    operator: '&&',
    parent: null,
    right,
    left,
  }
}

let createIdentifier = (
  name: string,
  range: [number, number],
): FakeIdentifier => ({
  type: 'Identifier',
  id: `id_${name}`,
  parent: null,
  raw: name,
  range,
  name,
})

describe('transform', () => {
  it('should transform a simple negated conjunction', () => {
    let leftId = createIdentifier('a', [0, 1])
    let rightId = createIdentifier('b', [5, 6])
    let conjunction = createConjunction(leftId, rightId)
    let unaryExpr = createUnaryExpression(conjunction)

    let context = createFakeContext('a && b')

    let result = transform({
      node: unaryExpr as unknown as UnaryExpression,
      expressionType: 'conjunction',
      shouldWrapInParens: false,
      context,
    })

    expect(result).toBe('!a || !b')
  })

  it('should transform a negated conjunction and wrap in parentheses when requested', () => {
    let leftId = createIdentifier('a', [0, 1])
    let rightId = createIdentifier('b', [5, 6])
    let conjunction = createConjunction(leftId, rightId)
    let unaryExpr = createUnaryExpression(conjunction)

    let context = createFakeContext('a && b')

    let result = transform({
      node: unaryExpr as unknown as UnaryExpression,
      expressionType: 'conjunction',
      shouldWrapInParens: true,
      context,
    })

    expect(result).toBe('(!a || !b)')
  })

  it('should preserve formatting in the transformed expression', () => {
    let leftId = createIdentifier('a', [0, 1])
    let rightId = createIdentifier('b', [7, 8])
    let conjunction = createConjunction(leftId, rightId, '  &&  ')
    conjunction.raw = 'a  &&  b'

    let unaryExpr = createUnaryExpression(conjunction)

    let context = createFakeContext('a  &&  b')

    let result = transform({
      node: unaryExpr as unknown as UnaryExpression,
      expressionType: 'conjunction',
      shouldWrapInParens: false,
      context,
    })

    expect(result).toBe('!a  ||  !b')
  })

  it('should transform a negated conjunction with multiple operands', () => {
    let idA = createIdentifier('a', [0, 1])
    let idB = createIdentifier('b', [5, 6])
    let idC = createIdentifier('c', [10, 11])

    let innerConjunction = createConjunction(idB, idC)
    let outerConjunction = createConjunction(idA, innerConjunction)
    outerConjunction.raw = 'a && b && c'

    let unaryExpr = createUnaryExpression(outerConjunction)

    let context = createFakeContext('a && b && c')

    let result = transform({
      node: unaryExpr as unknown as UnaryExpression,
      expressionType: 'conjunction',
      shouldWrapInParens: false,
      context,
    })

    expect(result).toBe('!a || !b || !c')
  })

  it('should transform expressions with already negated operands', () => {
    let idA = createIdentifier('a', [0, 1])
    let idB = createIdentifier('b', [6, 7])
    let notB: FakeUnaryExpression = {
      type: 'UnaryExpression',
      operator: '!',
      argument: idB,
      range: [5, 7],
      prefix: true,
      parent: null,
      id: 'not_b',
      raw: '!b',
    }

    let conjunction = createConjunction(idA, notB)
    conjunction.raw = 'a && !b'

    let unaryExpr = createUnaryExpression(conjunction)

    let context = createFakeContext('a && !b')

    let result = transform({
      node: unaryExpr as unknown as UnaryExpression,
      expressionType: 'conjunction',
      shouldWrapInParens: false,
      context,
    })

    expect(result).toBe('!a || b')
  })

  it('should return null for non-conjunction expressions', () => {
    let leftId = createIdentifier('a', [0, 1])
    let rightId = createIdentifier('b', [5, 6])

    let disjunction: FakeLogicalExpression = {
      type: 'LogicalExpression',
      id: 'disjunction',
      operator: '||',
      right: rightId,
      range: [0, 6],
      raw: 'a || b',
      left: leftId,
      parent: null,
    }

    let unaryExpr = createUnaryExpression(disjunction)

    let context = createFakeContext('a || b')

    let result = transform({
      node: unaryExpr as unknown as UnaryExpression,
      expressionType: 'conjunction',
      shouldWrapInParens: false,
      context,
    })

    expect(result).toBeNull()
  })

  it('should handle complex formatting and comments', () => {
    let leftId = createIdentifier('a', [0, 1])
    let rightId = createIdentifier('b', [20, 21])

    let conjunction = createConjunction(leftId, rightId, ' && // comment\n    ')
    conjunction.raw = 'a && // comment\n    b'

    let unaryExpr = createUnaryExpression(conjunction)

    let context = createFakeContext('a && // comment\n    b')

    let result = transform({
      node: unaryExpr as unknown as UnaryExpression,
      expressionType: 'conjunction',
      shouldWrapInParens: true,
      context,
    })

    expect(result).toBe('(!a || // comment\n    !b)')
  })

  it('should handle deeply nested conjunctions by limiting recursion depth', () => {
    let createDeepNestedConjunction = (depth: number): FakeNode => {
      let node: FakeNode = createIdentifier('a', [0, 1])

      for (let i = 0; i < depth; i++) {
        node = createConjunction(
          node,
          createIdentifier('a', [i * 4 + 4, i * 4 + 5]),
        )
        node.raw = `${node.raw} && a`
      }

      return node
    }

    let deepExpression = createDeepNestedConjunction(15)
    let unaryExpr = createUnaryExpression(deepExpression)

    let context = createFakeContext(deepExpression.raw ?? '')

    let result = transform({
      node: unaryExpr as unknown as UnaryExpression,
      expressionType: 'conjunction',
      shouldWrapInParens: false,
      context,
    })

    expect(result).toBeDefined()
    expect(result).not.toBeNull()

    expect(result?.includes('||')).toBeTruthy()

    let operatorCount = (result?.match(/\|\|/gu) ?? []).length
    expect(operatorCount).toBeLessThan(15)
  })

  it('should handle deeply nested conjunctions with negated operands', () => {
    let createDeepNestedConjunction = (depth: number): FakeNode => {
      let node: FakeNode = createIdentifier('a', [0, 1])

      for (let i = 0; i < depth; i++) {
        node = createConjunction(
          node,
          createUnaryExpression(createIdentifier('a', [i * 4 + 4, i * 4 + 5])),
        )
        node.raw = `${node.raw} && !a`
      }

      return node
    }

    let deepExpression = createDeepNestedConjunction(15)
    let unaryExpr = createUnaryExpression(deepExpression)

    let context = createFakeContext(deepExpression.raw ?? '')

    let result = transform({
      node: unaryExpr as unknown as UnaryExpression,
      expressionType: 'conjunction',
      shouldWrapInParens: false,
      context,
    })

    expect(result).toBeDefined()
    expect(result).not.toBeNull()

    expect(result?.includes('||')).toBeTruthy()

    let operatorCount = (result?.match(/\|\|/gu) ?? []).length
    expect(operatorCount).toBeLessThan(15)
  })
})
