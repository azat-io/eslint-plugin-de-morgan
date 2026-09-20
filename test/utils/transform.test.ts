import type { LogicalExpression, UnaryExpression, Identifier } from 'estree'
import type { Rule } from 'eslint'

import { describe, expect, it } from 'vitest'
import { Linter } from 'eslint'

import { transform } from '../../utils/transform'

let linter = new Linter()

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

const DEEP_NESTING_DEPTH = 15

function transformCode(
  code: string,
  expressionType: 'conjunction' | 'disjunction',
  shouldWrapInParens: boolean = false,
): string | null {
  let results: (string | null)[] = []
  let rule: Rule.RuleModule = {
    create: context => ({
      UnaryExpression: node => {
        results.push(
          transform({
            canStripNegation: true,
            shouldWrapInParens,
            expressionType,
            context,
            node,
          }),
        )
      },
    }),
  }

  linter.verify(code, {
    plugins: { test: { rules: { transform: rule } } },
    rules: { 'test/transform': 'error' },
  })

  let [result] = results
  if (result === undefined) {
    throw new Error(`Expected a negated expression in: ${code}`)
  }
  return result
}

function expectDeepNestingIsTruncated(shouldNegateOperands: boolean): void {
  let deepExpression = createDeepNestedConjunction(shouldNegateOperands)
  let unaryExpression = createUnaryExpression(deepExpression)

  let context = createFakeContext(deepExpression.raw ?? '')

  let result = transform({
    expressionType: 'conjunction',
    shouldWrapInParens: false,
    canStripNegation: true,
    node: unaryExpression,
    context,
  })

  expect(result).toBeDefined()
  expect(result).not.toBeNull()

  expect(result?.includes('||')).toBeTruthy()

  let operatorCount = (result?.match(/\|\|/gu) ?? []).length
  expect(operatorCount).toBeLessThan(DEEP_NESTING_DEPTH)
}

function createConjunction(
  left: FakeNode,
  right: FakeNode,
  formattingBetween: string = ' && ',
): FakeLogicalExpression {
  let leftText = left.raw ?? ''
  let rightText = right.raw ?? ''

  return {
    range: [
      left.range ? left.range[0] : 0,
      right.range ?
        right.range[1]
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

function transformSimpleConjunction(
  shouldWrapInParens: boolean,
): string | null {
  let leftId = createIdentifier('a', [0, 1])
  let rightId = createIdentifier('b', [5, 6])
  let conjunction = createConjunction(leftId, rightId)
  let unaryExpression = createUnaryExpression(conjunction)

  let context = createFakeContext('a && b')

  return transform({
    expressionType: 'conjunction',
    canStripNegation: true,
    node: unaryExpression,
    shouldWrapInParens,
    context,
  })
}

function createDeepNestedConjunction(shouldNegateOperands: boolean): FakeNode {
  let operandText = shouldNegateOperands ? '!a' : 'a'
  let node: FakeNode = createIdentifier('a', [0, 1])

  for (let i = 0; i < DEEP_NESTING_DEPTH; i++) {
    let operand = createIdentifier('a', [i * 4 + 4, i * 4 + 5])

    node = createConjunction(
      node,
      shouldNegateOperands ? createUnaryExpression(operand) : operand,
    )
    node.raw = `${node.raw} && ${operandText}`
  }

  return node
}

function createFakeContext(sourceText: string): Rule.RuleContext {
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
    sourceCode: fakeSourceCode,
  } as unknown as Rule.RuleContext
}

function createUnaryExpression(
  argument: FakeNode,
  parent: FakeNode | null = null,
): FakeUnaryExpression {
  return {
    range: [0, argument.range ? argument.range[1] + 1 : 1],
    raw: `!(${argument.raw})`,
    type: 'UnaryExpression',
    operator: '!',
    prefix: true,
    id: 'unary',
    argument,
    parent,
  }
}

function createIdentifier(
  name: string,
  range: [number, number],
): FakeIdentifier {
  return {
    type: 'Identifier',
    id: `id_${name}`,
    parent: null,
    raw: name,
    range,
    name,
  }
}

describe('transform', () => {
  it('should transform a simple negated conjunction', () => {
    expect.assertions(1)

    expect(transformSimpleConjunction(false)).toBe('!a || !b')
  })

  it('should transform a negated conjunction and wrap in parentheses when requested', () => {
    expect.assertions(1)

    expect(transformSimpleConjunction(true)).toBe('(!a || !b)')
  })

  it('should preserve formatting in the transformed expression', () => {
    expect.assertions(1)

    expect(transformCode('!(a  &&  b)', 'conjunction')).toBe('!a  ||  !b')
  })

  it('should transform a negated conjunction with multiple operands', () => {
    expect.assertions(1)

    let idA = createIdentifier('a', [0, 1])
    let idB = createIdentifier('b', [5, 6])
    let idC = createIdentifier('c', [10, 11])

    let innerConjunction = createConjunction(idB, idC)
    let outerConjunction = createConjunction(idA, innerConjunction)
    outerConjunction.raw = 'a && b && c'

    let unaryExpression = createUnaryExpression(outerConjunction)

    let context = createFakeContext('a && b && c')

    let result = transform({
      expressionType: 'conjunction',
      shouldWrapInParens: false,
      canStripNegation: true,
      node: unaryExpression,
      context,
    })

    expect(result).toBe('!a || !b || !c')
  })

  it('should transform expressions with already negated operands', () => {
    expect.assertions(1)

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

    let unaryExpression = createUnaryExpression(conjunction)

    let context = createFakeContext('a && !b')

    let result = transform({
      expressionType: 'conjunction',
      shouldWrapInParens: false,
      canStripNegation: true,
      node: unaryExpression,
      context,
    })

    expect(result).toBe('!a || b')
  })

  it('should return null for non-conjunction expressions', () => {
    expect.assertions(1)

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

    let unaryExpression = createUnaryExpression(disjunction)

    let context = createFakeContext('a || b')

    let result = transform({
      expressionType: 'conjunction',
      shouldWrapInParens: false,
      canStripNegation: true,
      node: unaryExpression,
      context,
    })

    expect(result).toBeNull()
  })

  it('should handle complex formatting and comments', () => {
    expect.assertions(1)

    expect(
      transformCode('!(a && // comment\n    b)', 'conjunction', true),
    ).toBe('(!a || // comment\n    !b)')
  })

  it('should drop grouping parentheses without comments', () => {
    expect.assertions(1)

    expect(transformCode('!((a) &&\n    (b))', 'conjunction')).toBe(
      '!a ||\n    !b',
    )
  })

  it('should keep grouping parentheses that contain comments', () => {
    expect.assertions(2)

    expect(transformCode('!(a || (/* keep */ b))', 'disjunction')).toBe(
      '!a && !(/* keep */ b)',
    )
    expect(transformCode('!((a // keep\n) || b)', 'disjunction')).toBe(
      '!(a // keep\n) && !b',
    )
  })

  it('should not replace operators inside comments', () => {
    expect.assertions(1)

    expect(transformCode('!(a && /* a && b */ b)', 'conjunction')).toBe(
      '!a || /* a && b */ !b',
    )
  })

  it('should handle deeply nested conjunctions by limiting recursion depth', () => {
    expect.assertions(4)

    expectDeepNestingIsTruncated(false)
  })

  it('should handle deeply nested conjunctions with negated operands', () => {
    expect.assertions(4)

    expectDeepNestingIsTruncated(true)
  })
})
