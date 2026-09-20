import type { Rule } from 'eslint'

import { describe, expect, it } from 'vitest'
import { Linter } from 'eslint'

import { getGroupingParens } from '../../utils/get-grouping-parens'

let linter = new Linter()

function getGroups(code: string): (string | null)[] {
  let groups: (string | null)[] = []
  let rule: Rule.RuleModule = {
    create: context => ({
      LogicalExpression: node => {
        for (let operand of [node.left, node.right]) {
          let parens = getGroupingParens(operand, context.sourceCode)
          groups.push(
            parens &&
              context.sourceCode.text.slice(
                parens[0].range[0],
                parens[1].range[1],
              ),
          )
        }
      },
    }),
  }

  linter.verify(code, {
    plugins: { test: { rules: { 'get-grouping-parens': rule } } },
    rules: { 'test/get-grouping-parens': 'error' },
  })

  return groups
}

describe('getGroupingParens', () => {
  it('should return null for operands without parentheses', () => {
    expect.assertions(1)

    expect(getGroups('!(a && b)')).toStrictEqual([null, null])
  })

  it('should find parentheses around an operand', () => {
    expect.assertions(2)

    expect(getGroups('(a) || b')).toStrictEqual(['(a)', null])
    expect(getGroups('a || (b && c)')).toStrictEqual([
      null,
      '(b && c)',
      null,
      null,
    ])
  })

  it('should return the outermost pair of nested parentheses', () => {
    expect.assertions(1)

    expect(getGroups('!(((a)) || b)')).toStrictEqual(['((a))', null])
  })

  it('should include comments inside the parentheses', () => {
    expect.assertions(2)

    expect(getGroups('a || (/* keep */ b)')).toStrictEqual([
      null,
      '(/* keep */ b)',
    ])
    expect(getGroups('(a // keep\n) && b')).toStrictEqual([
      '(a // keep\n)',
      null,
    ])
  })

  it('should ignore parentheses that belong to other syntax', () => {
    expect.assertions(2)

    expect(getGroups('if (a || b) {}')).toStrictEqual([null, null])
    expect(getGroups('f(a && b)')).toStrictEqual([null, null])
  })
})
