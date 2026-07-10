import type { UnaryExpression } from 'estree'
import type { Rule } from 'eslint'

import { describe, expect, it } from 'vitest'

import { needsParentParens } from '../../utils/needs-parent-parens'

type ParentedNode = Rule.NodeParentExtension & UnaryExpression

function createNode(parent: object): ParentedNode {
  return {
    argument: { type: 'Identifier', name: 'a' },
    type: 'UnaryExpression',
    operator: '!',
    prefix: true,
    parent,
  } as unknown as ParentedNode
}

describe('needsParentParens', () => {
  it('should wrap when the node is a member expression object', () => {
    expect.assertions(1)

    let parent = { parent: { type: 'ExpressionStatement' }, object: null }
    let node = createNode(Object.assign(parent, { type: 'MemberExpression' }))
    parent.object = node as never
    expect(needsParentParens(node, '||')).toBeTruthy()
  })

  it('should not wrap when the node is a computed member property', () => {
    expect.assertions(1)

    let parent = {
      object: { type: 'Identifier', name: 'o' },
      parent: { type: 'ExpressionStatement' },
      type: 'MemberExpression',
    }
    let node = createNode(parent)
    expect(needsParentParens(node, '||')).toBeFalsy()
  })

  it('should wrap when the node is a callee', () => {
    expect.assertions(2)

    for (let type of ['CallExpression', 'NewExpression']) {
      let parent = { parent: { type: 'ExpressionStatement' }, callee: null }
      let node = createNode(Object.assign(parent, { type }))
      parent.callee = node as never
      expect(needsParentParens(node, '||')).toBeTruthy()
    }
  })

  it('should not wrap when the node is a call argument', () => {
    expect.assertions(1)

    let parent = {
      callee: { type: 'Identifier', name: 'foo' },
      parent: { type: 'ExpressionStatement' },
      type: 'CallExpression',
    }
    let node = createNode(parent)
    expect(needsParentParens(node, '||')).toBeFalsy()
  })

  it('should wrap when the node is a tagged template tag', () => {
    expect.assertions(1)

    let parent = {
      parent: { type: 'ExpressionStatement' },
      type: 'TaggedTemplateExpression',
    }
    let node = createNode(parent)
    expect(needsParentParens(node, '||')).toBeTruthy()
  })

  it('should wrap when the parent is an await expression', () => {
    expect.assertions(1)

    let parent = {
      parent: { type: 'ExpressionStatement' },
      type: 'AwaitExpression',
    }
    let node = createNode(parent)
    expect(needsParentParens(node, '||')).toBeTruthy()
  })

  it('should not wrap when the parent operator binds looser', () => {
    expect.assertions(2)

    let disjunctionParent = {
      parent: { type: 'ExpressionStatement' },
      type: 'LogicalExpression',
      operator: '||',
    }
    expect(needsParentParens(createNode(disjunctionParent), '||')).toBeFalsy()

    let conjunctionParent = {
      parent: { type: 'ExpressionStatement' },
      type: 'LogicalExpression',
      operator: '&&',
    }
    expect(needsParentParens(createNode(conjunctionParent), '&&')).toBeFalsy()
  })

  it('should wrap when the node is a for statement initializer', () => {
    expect.assertions(1)

    let parent = { type: 'ForStatement', init: null }
    let node = createNode(parent)
    parent.init = node as never
    expect(needsParentParens(node, '||')).toBeTruthy()
  })

  it('should not wrap when the parent chain ends without a statement', () => {
    expect.assertions(1)

    let parent = { type: 'BinaryExpression', operator: '===' }
    let node = createNode(parent)
    expect(needsParentParens(node, '||')).toBeTruthy()
  })
})
