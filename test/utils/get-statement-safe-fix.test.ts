import type { UnaryExpression } from 'estree'
import type { Rule } from 'eslint'

import { describe, expect, it } from 'vitest'

import { getStatementSafeFix } from '../../utils/get-statement-safe-fix'

type ParentedNode = Rule.NodeParentExtension & UnaryExpression

let fakeContext = {
  sourceCode: {
    getTokenBefore: () => null,
  },
} as unknown as Rule.RuleContext

describe('getStatementSafeFix', () => {
  it('should return the fix unchanged when the statement range is missing', () => {
    expect.assertions(1)

    let node = {
      parent: { type: 'ExpressionStatement' },
      type: 'UnaryExpression',
      range: [0, 10],
    } as unknown as ParentedNode
    expect(
      getStatementSafeFix({ context: fakeContext, fix: '!a || !b', node }),
    ).toBe('!a || !b')
  })

  it('should return the fix unchanged when the node range is missing', () => {
    expect.assertions(1)

    let node = {
      parent: { type: 'ExpressionStatement', range: [0, 10] },
      type: 'UnaryExpression',
    } as unknown as ParentedNode
    expect(
      getStatementSafeFix({ context: fakeContext, fix: '!a || !b', node }),
    ).toBe('!a || !b')
  })
})
