import type { UnaryExpression } from 'estree'
import type { Rule } from 'eslint'

import { describe, expect, it } from 'vitest'

import { isInTruthinessContext } from '../../utils/is-in-truthiness-context'

type ParentedNode = Rule.NodeParentExtension & UnaryExpression

function createNode(parent: undefined | object): ParentedNode {
  return {
    argument: { type: 'Identifier', name: 'a' },
    type: 'UnaryExpression',
    operator: '!',
    prefix: true,
    parent,
  } as unknown as ParentedNode
}

describe('isInTruthinessContext', () => {
  it('should treat a logical negation parent as a truthiness context', () => {
    expect.assertions(1)

    let node = createNode({ type: 'UnaryExpression', operator: '!' })
    expect(isInTruthinessContext(node)).toBeTruthy()
  })

  it('should treat a discarded sequence position as a truthiness context', () => {
    expect.assertions(1)

    let parent = { expressions: [] as object[], type: 'SequenceExpression' }
    let node = createNode(parent)
    parent.expressions.push(node, { type: 'Identifier', name: 'b' })
    expect(isInTruthinessContext(node)).toBeTruthy()
  })

  it('should climb through the trailing sequence position', () => {
    expect.assertions(1)

    let parent = {
      parent: { type: 'AssignmentExpression' },
      expressions: [] as object[],
      type: 'SequenceExpression',
    }
    let node = createNode(parent)
    parent.expressions.push({ type: 'Identifier', name: 'b' }, node)
    expect(isInTruthinessContext(node)).toBeFalsy()
  })

  it('should not treat a node without a parent as a truthiness context', () => {
    expect.assertions(1)

    let node = createNode(undefined)
    expect(isInTruthinessContext(node)).toBeFalsy()
  })
})
