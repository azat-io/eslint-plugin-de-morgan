import { describe, expect, it } from 'vitest'

import { inspectNode } from './inspect-node'

describe('inspectNode', () => {
  it('should inspect the first node that matches the selector', () => {
    expect.assertions(1)

    let range = inspectNode('a; b', 'Identifier', node => node.range)

    expect(range).toStrictEqual([0, 1])
  })

  it('should fail instead of returning nothing when no node matches', () => {
    expect.assertions(1)

    expect(() => inspectNode('x = a', 'BinaryExpression', () => true)).toThrow(
      'No node matches BinaryExpression in x = a.',
    )
  })

  it('should name the parsing error when the code does not parse', () => {
    expect.assertions(1)

    expect(() => inspectNode('x = (', 'Program', () => true)).toThrow(
      'Parsing error',
    )
  })
})
