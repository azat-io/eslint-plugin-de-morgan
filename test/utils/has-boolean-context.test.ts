import type {
  ConditionalExpression,
  LogicalExpression,
  BinaryExpression,
  DoWhileStatement,
  MemberExpression,
  UnaryExpression,
  CallExpression,
  WhileStatement,
  ForStatement,
  IfStatement,
  Identifier,
  Node,
} from 'estree'

import { describe, expect, it } from 'vitest'

import { hasBooleanContext } from '../../utils/has-boolean-context'

type FakeNode<T extends Node> = { parent?: Node } & T

describe('hasBooleanContext', () => {
  it('should return true when inside an IfStatement condition', () => {
    let testNode: FakeNode<Identifier> = { type: 'Identifier', name: 'a' }
    let node: FakeNode<IfStatement> = {
      consequent: { type: 'BlockStatement', body: [] },
      type: 'IfStatement',
      test: testNode,
    }
    testNode.parent = node

    expect(hasBooleanContext(testNode)).toBeTruthy()
  })

  it('should return true when inside a WhileStatement condition', () => {
    let testNode: FakeNode<Identifier> = { type: 'Identifier', name: 'b' }
    let node: FakeNode<WhileStatement> = {
      body: { type: 'BlockStatement', body: [] },
      type: 'WhileStatement',
      test: testNode,
    }
    testNode.parent = node

    expect(hasBooleanContext(testNode)).toBeTruthy()
  })

  it('should return true when inside a ForStatement test condition', () => {
    let testNode: FakeNode<Identifier> = { type: 'Identifier', name: 'i' }
    let node: FakeNode<ForStatement> = {
      body: { type: 'BlockStatement', body: [] },
      type: 'ForStatement',
      test: testNode,
      update: null,
      init: null,
    }
    testNode.parent = node

    expect(hasBooleanContext(testNode)).toBeTruthy()
  })

  it('should return true when inside a DoWhileStatement condition', () => {
    let testNode: FakeNode<Identifier> = { type: 'Identifier', name: 'c' }
    let node: FakeNode<DoWhileStatement> = {
      body: { type: 'BlockStatement', body: [] },
      type: 'DoWhileStatement',
      test: testNode,
    }
    testNode.parent = node

    expect(hasBooleanContext(testNode)).toBeTruthy()
  })

  it('should return true when inside a ConditionalExpression test', () => {
    let testNode: FakeNode<Identifier> = { type: 'Identifier', name: 'x' }
    let node: FakeNode<ConditionalExpression> = {
      consequent: { type: 'Literal', value: 1 },
      alternate: { type: 'Literal', value: 0 },
      type: 'ConditionalExpression',
      test: testNode,
    }
    testNode.parent = node

    expect(hasBooleanContext(testNode)).toBeTruthy()
  })

  it('should return true when part of a LogicalExpression (&& operator)', () => {
    let testNode: FakeNode<Identifier> = { type: 'Identifier', name: 'a' }
    let node: FakeNode<LogicalExpression> = {
      right: { type: 'Identifier', name: 'b' },
      type: 'LogicalExpression',
      operator: '&&',
      left: testNode,
    }
    testNode.parent = node

    expect(hasBooleanContext(testNode)).toBeTruthy()
  })

  it('should return true when part of a LogicalExpression (|| operator)', () => {
    let testNode: FakeNode<Identifier> = { type: 'Identifier', name: 'a' }
    let node: FakeNode<LogicalExpression> = {
      right: { type: 'Identifier', name: 'b' },
      type: 'LogicalExpression',
      operator: '||',
      left: testNode,
    }
    testNode.parent = node

    expect(hasBooleanContext(testNode)).toBeTruthy()
  })

  it('should return true when part of a UnaryExpression with "!" operator', () => {
    let testNode: FakeNode<Identifier> = { type: 'Identifier', name: 'x' }
    let node: FakeNode<UnaryExpression> = {
      type: 'UnaryExpression',
      argument: testNode,
      operator: '!',
      prefix: true,
    }
    testNode.parent = node

    expect(hasBooleanContext(testNode)).toBeTruthy()
  })

  it('should return false for a BinaryExpression with a non-boolean operator', () => {
    let testNode: FakeNode<Identifier> = { type: 'Identifier', name: 'a' }
    let node: FakeNode<BinaryExpression> = {
      right: { type: 'Identifier', name: 'b' },
      type: 'BinaryExpression',
      left: testNode,
      operator: '+',
    }
    testNode.parent = node

    expect(hasBooleanContext(testNode)).toBeFalsy()
  })

  it('should return false for a literal number', () => {
    let node: FakeNode<Node> = {
      type: 'Literal',
      value: 123,
    }

    expect(hasBooleanContext(node)).toBeFalsy()
  })

  it('should return false when inside a non-Boolean function call', () => {
    let testNode: FakeNode<Identifier> = { type: 'Identifier', name: 'x' }
    let nonBooleanCall: FakeNode<CallExpression> = {
      callee: { name: 'someFunction', type: 'Identifier' },
      type: 'CallExpression',
      arguments: [testNode],
      optional: false,
    }
    testNode.parent = nonBooleanCall

    expect(hasBooleanContext(testNode)).toBeFalsy()
  })

  it('should return false when inside an object property access', () => {
    let testNode: FakeNode<Identifier> = { type: 'Identifier', name: 'prop' }
    let memberExpression: FakeNode<MemberExpression> = {
      object: { type: 'Identifier', name: 'obj' },
      type: 'MemberExpression',
      property: testNode,
      computed: false,
      optional: false,
    }
    testNode.parent = memberExpression

    expect(hasBooleanContext(testNode)).toBeFalsy()
  })
})
