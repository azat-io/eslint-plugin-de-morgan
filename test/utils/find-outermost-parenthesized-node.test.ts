import type { LogicalExpression, Expression } from 'estree'

import { describe, expect, it } from 'vitest'

import { findOutermostParenthesizedNode } from '../../utils/find-outermost-parenthesized-node'

interface FakeLogicalExpression extends LogicalExpression {
  parent?: FakeLogicalExpression
  range: [number, number]
}

type FakeNode = {
  range: [number, number]
  parent?: FakeNode
} & Expression

let createNode = (range: [number, number], parent?: FakeNode): FakeNode => ({
  type: 'Identifier',
  name: 'a',
  parent,
  range,
})

let createLogicalExpression = (
  range: [number, number],
  parent?: FakeLogicalExpression,
): FakeLogicalExpression => ({
  type: 'LogicalExpression',
  right: createNode([2, 3]),
  left: createNode([0, 1]),
  operator: '&&',
  parent,
  range,
})

describe('findOutermostParenthesizedNode', () => {
  it('should return the same node if it is already wrapped in parentheses', () => {
    let sourceCode = '(a && b)'
    let node = createLogicalExpression([1, 6])
    let result = findOutermostParenthesizedNode(node, sourceCode)
    expect(result).toBe(node)
  })

  it('should return the topmost logical expression if no parentheses exist', () => {
    let sourceCode = 'a && b && c'
    let node = createLogicalExpression([0, 9])
    let result = findOutermostParenthesizedNode(node, sourceCode)
    expect(result).toBe(node)
  })

  it('should return the node itself if it is already in parentheses', () => {
    let sourceCode = '(a || b)'
    let node = createLogicalExpression([1, 7])
    let result = findOutermostParenthesizedNode(node, sourceCode)
    expect(result).toBe(node)
  })

  it('should stop at the first encountered parenthesized ancestor', () => {
    let sourceCode = '(a || (b && c))'

    let innerNode = createLogicalExpression([6, 11])
    let middleNode = createLogicalExpression([5, 12], innerNode)
    let outerNode = createLogicalExpression([1, 13], middleNode)
    innerNode.parent = middleNode
    middleNode.parent = outerNode

    let result = findOutermostParenthesizedNode(innerNode, sourceCode)
    expect(result).toBe(outerNode)
  })
})
