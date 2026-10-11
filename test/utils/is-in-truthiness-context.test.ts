import { describe, expect, it } from 'vitest'

import { isInTruthinessContext } from '../../utils/is-in-truthiness-context'
import { inspectNegatedGroup, inspectNode } from '../helpers/inspect-node'

describe('isInTruthinessContext', () => {
  it.each([
    { position: 'the argument of a negation', code: 'x = !!(a && b)' },
    { position: 'a discarded sequence value', code: 'x = (!(a && b), c)' },
  ])('should treat $position as a truthiness context', ({ code }) => {
    expect.assertions(1)

    let result = inspectNegatedGroup(code, isInTruthinessContext)

    expect(result).toBeTruthy()
  })

  it('should not treat the assigned last value of a sequence as a truthiness context', () => {
    expect.assertions(1)

    let result = inspectNegatedGroup(
      'x = (c, !(a && b))',
      isInTruthinessContext,
    )

    expect(result).toBeFalsy()
  })

  it('should not treat a node without a parent as a truthiness context', () => {
    expect.assertions(1)

    let result = inspectNode('a', 'Program', isInTruthinessContext)

    expect(result).toBeFalsy()
  })
})
