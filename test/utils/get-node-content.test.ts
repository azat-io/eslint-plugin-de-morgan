import type { SourceCode, Rule } from 'eslint'
import type { Node } from 'estree'

import { describe, expect, it, vi } from 'vitest'

import { getNodeContent } from '../../utils/get-node-content'

describe('getNodeContent', () => {
  it('should return the source code text for the given node', () => {
    let fakeNode: Node = {
      type: 'Identifier',
      name: 'a',
    }

    let fakeSourceCode = {
      getText: vi.fn((_node: Node) => 'node content'),
    } as unknown as SourceCode

    let fakeContext = {
      sourceCode: fakeSourceCode,
    } as unknown as Rule.RuleContext

    let result = getNodeContent(fakeNode, fakeContext)

    expect(result).toBe('node content')

    expect(fakeSourceCode.getText).toHaveBeenCalledWith(fakeNode)
  })
})
