import type { LogicalExpression, Expression } from 'estree'
import type { Rule } from 'eslint'

import { describe, expect, it } from 'vitest'

import { isPureGroup } from '../../utils/is-pure-group'

type FakeLogicalExpression = {
  range: [number, number]
  parent?: FakeNode
  code: string
} & LogicalExpression

type FakeNode = {
  range: [number, number]
  parent?: FakeNode
  code: string
} & Expression

let currentCode = ''

let fakeContext: Rule.RuleContext = {
  getSourceCode: () => ({
    getText: () => currentCode,
  }),
} as Rule.RuleContext

describe('isPureGroup', () => {
  it('should return false for a mixed group: (a && b || c)', () => {
    let code = '(a && b || c)'
    currentCode = code

    let node: FakeLogicalExpression = {
      left: {
        right: {
          type: 'Identifier',
          range: [6, 7],
          name: 'b',
          code: 'b',
        } as FakeNode,
        left: {
          type: 'Identifier',
          range: [1, 2],
          name: 'a',
          code: 'a',
        } as FakeNode,
        type: 'LogicalExpression',
        operator: '&&',
        code: 'a && b',
        range: [1, 7],
      } as FakeLogicalExpression,
      right: {
        type: 'Identifier',
        range: [11, 12],
        name: 'c',
        code: 'c',
      } as FakeNode,
      type: 'LogicalExpression',
      range: [0, code.length],
      operator: '||',
      code,
    }

    expect(isPureGroup(node, fakeContext)).toBeFalsy()
  })

  it('should return true for a pure group with nested grouping: ((a && b) || c)', () => {
    let code = '((a && b) || c)'
    currentCode = code

    let node: FakeLogicalExpression = {
      left: {
        right: {
          type: 'Identifier',
          range: [7, 8],
          name: 'b',
          code: 'b',
        } as FakeNode,
        left: {
          type: 'Identifier',
          range: [2, 3],
          name: 'a',
          code: 'a',
        } as FakeNode,
        type: 'LogicalExpression',
        code: '(a && b)',
        operator: '&&',
        range: [1, 9],
      } as FakeLogicalExpression,
      right: {
        type: 'Identifier',
        range: [13, 14],
        name: 'c',
        code: 'c',
      } as FakeNode,
      type: 'LogicalExpression',
      range: [0, code.length],
      operator: '||',
      code,
    }

    expect(isPureGroup(node, fakeContext)).toBeTruthy()
  })

  it('should return true for a group with only &&: (a && b)', () => {
    let code = '(a && b)'
    currentCode = code

    let node: FakeLogicalExpression = {
      right: {
        type: 'Identifier',
        range: [6, 7],
        name: 'b',
        code: 'b',
      } as FakeNode,
      left: {
        type: 'Identifier',
        range: [1, 2],
        name: 'a',
        code: 'a',
      } as FakeNode,
      type: 'LogicalExpression',
      range: [0, code.length],
      operator: '&&',
      code,
    }

    expect(isPureGroup(node, fakeContext)).toBeTruthy()
  })

  it('should handle deeply nested expressions: (((a && b) || c) && d)', () => {
    let code = '(((a && b) || c) && d)'
    currentCode = code

    let innerNode: FakeLogicalExpression = {
      right: {
        type: 'Identifier',
        range: [8, 9],
        name: 'b',
        code: 'b',
      } as FakeNode,
      left: {
        type: 'Identifier',
        range: [3, 4],
        name: 'a',
        code: 'a',
      } as FakeNode,
      type: 'LogicalExpression',
      code: '(a && b)',
      operator: '&&',
      range: [2, 10],
    }

    let middleNode: FakeLogicalExpression = {
      right: {
        type: 'Identifier',
        range: [14, 15],
        name: 'c',
        code: 'c',
      } as FakeNode,
      type: 'LogicalExpression',
      code: '((a && b) || c)',
      left: innerNode,
      operator: '||',
      range: [1, 16],
    }

    innerNode.parent = middleNode

    let outerNode: FakeLogicalExpression = {
      right: {
        type: 'Identifier',
        range: [20, 21],
        name: 'd',
        code: 'd',
      } as FakeNode,
      type: 'LogicalExpression',
      range: [0, code.length],
      left: middleNode,
      operator: '&&',
      code,
    }

    middleNode.parent = outerNode

    expect(isPureGroup(innerNode, fakeContext)).toBeTruthy()
  })

  it('should stop at the first parenthesized parent: a && (b || c)', () => {
    let code = 'a && (b || c)'
    currentCode = code

    let innerNode: FakeLogicalExpression = {
      right: {
        type: 'Identifier',
        range: [11, 12],
        name: 'c',
        code: 'c',
      } as FakeNode,
      left: {
        type: 'Identifier',
        range: [6, 7],
        name: 'b',
        code: 'b',
      } as FakeNode,
      type: 'LogicalExpression',
      code: '(b || c)',
      operator: '||',
      range: [5, 13],
    }

    let outerNode: FakeLogicalExpression = {
      left: {
        type: 'Identifier',
        range: [0, 1],
        name: 'a',
        code: 'a',
      } as FakeNode,
      type: 'LogicalExpression',
      range: [0, code.length],
      right: innerNode,
      operator: '&&',
      code,
    }

    innerNode.parent = outerNode

    expect(isPureGroup(innerNode, fakeContext)).toBeTruthy()
  })

  it('should stop at outer parentheses when checking parent chain: (a && (b || c))', () => {
    let code = '(a && (b || c))'
    currentCode = code

    let innerNode: FakeLogicalExpression = {
      right: {
        type: 'Identifier',
        range: [12, 13],
        name: 'c',
        code: 'c',
      } as FakeNode,
      left: {
        type: 'Identifier',
        range: [7, 8],
        name: 'b',
        code: 'b',
      } as FakeNode,
      type: 'LogicalExpression',
      code: '(b || c)',
      operator: '||',
      range: [6, 14],
    }

    let middleNode: FakeLogicalExpression = {
      left: {
        type: 'Identifier',
        range: [1, 2],
        name: 'a',
        code: 'a',
      } as FakeNode,
      type: 'LogicalExpression',
      code: 'a && (b || c)',
      right: innerNode,
      operator: '&&',
      range: [1, 14],
    }

    innerNode.parent = middleNode

    let outerNode: FakeLogicalExpression = {
      ...middleNode,
      range: [0, code.length],
      code,
    }

    middleNode.parent = outerNode

    expect(isPureGroup(innerNode, fakeContext)).toBeTruthy()
  })
})
