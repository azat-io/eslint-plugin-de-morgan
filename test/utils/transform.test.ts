import { describe, expect, it } from 'vitest'

import { inspectNegatedGroup } from '../helpers/inspect-node'
import { transform } from '../../utils/transform'

function transformCode(
  code: string,
  expressionType: 'conjunction' | 'disjunction',
  shouldWrapInParens: boolean = false,
): string | null {
  return inspectNegatedGroup(code, (node, context) =>
    transform({
      canStripNegation: true,
      shouldWrapInParens,
      expressionType,
      context,
      node,
    }),
  )
}

describe('transform', () => {
  it('should transform a simple negated conjunction', () => {
    expect.assertions(1)

    expect(transformCode('!(a && b)', 'conjunction')).toBe('!a || !b')
  })

  it('should transform a negated conjunction and wrap in parentheses when requested', () => {
    expect.assertions(1)

    expect(transformCode('!(a && b)', 'conjunction', true)).toBe('(!a || !b)')
  })

  it('should preserve formatting in the transformed expression', () => {
    expect.assertions(1)

    expect(transformCode('!(a  &&  b)', 'conjunction')).toBe('!a  ||  !b')
  })

  it('should transform a negated conjunction with multiple operands', () => {
    expect.assertions(1)

    expect(transformCode('!(a && b && c)', 'conjunction')).toBe(
      '!a || !b || !c',
    )
  })

  it('should transform expressions with already negated operands', () => {
    expect.assertions(1)

    expect(transformCode('!(a && !b)', 'conjunction')).toBe('!a || b')
  })

  it('should return null for a group of the other kind', () => {
    expect.assertions(1)

    expect(transformCode('!(a || b)', 'conjunction')).toBeNull()
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

  it.each([
    {
      output: '!a && !(/* keep */ b)',
      code: '!(a || (/* keep */ b))',
      operand: 'the right operand',
    },
    {
      output: '!(a // keep\n) && !b',
      code: '!((a // keep\n) || b)',
      operand: 'the left operand',
    },
  ])(
    'should keep the grouping parentheses of $operand when they contain a comment',
    ({ output, code }) => {
      expect.assertions(1)

      expect(transformCode(code, 'disjunction')).toBe(output)
    },
  )

  it('should not replace operators inside comments', () => {
    expect.assertions(1)

    expect(transformCode('!(a && /* a && b */ b)', 'conjunction')).toBe(
      '!a || /* a && b */ !b',
    )
  })

  it.each([
    {
      code: '!(a && a && a && a && a && a && a && a && a && a && a && a && a && a && a && a)',
      operands: 'plain operands',
    },
    {
      code: '!(!a && !a && !a && !a && !a && !a && !a && !a && !a && !a && !a && !a && !a && !a && !a && !a)',
      operands: 'negated operands',
    },
  ])(
    'should expand a chain of $operands deeper than the depth limit only partly',
    ({ code }) => {
      expect.assertions(2)

      let result = transformCode(code, 'conjunction')

      expect(result).toContain('||')
      expect(result).toContain('&&')
    },
  )
})
