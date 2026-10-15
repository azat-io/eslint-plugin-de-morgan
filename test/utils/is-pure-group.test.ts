import type { UnaryExpression } from 'estree'

import { describe, expect, it } from 'vitest'

import { isPureGroup } from '../../utils/is-pure-group'
import { inspectNode } from '../helpers/inspect-node'

function checkPureGroup(code: string): boolean {
  return inspectNode(code, 'UnaryExpression', (node, context) =>
    isPureGroup(node as UnaryExpression, context),
  )
}

describe('isPureGroup', () => {
  it.each([
    { group: 'a conjunction', code: '!(a && b)' },
    { group: 'a disjunction of three operands', code: '!(a || b || c)' },
    { group: 'a negated identifier', code: '!a' },
    {
      group: 'a grouped conjunction in a disjunction',
      code: '!((a && b) || c)',
    },
    {
      group: 'a disjunction with a grouped conjunction',
      code: '!(a || (b && c))',
    },
    {
      group: 'a disjunction with a grouped mixed group',
      code: '!(a || (b || c && d))',
    },
  ])('should treat $group as a pure group', ({ code }) => {
    expect.assertions(1)

    expect(checkPureGroup(code)).toBe(true)
  })

  it.each([
    { group: 'a conjunction before a disjunction', code: '!(a && b || c)' },
    { group: 'a conjunction after a disjunction', code: '!(a || b && c)' },
    {
      group: 'a conjunction between disjunctions',
      code: '!(a || b && c || d)',
    },
    {
      group: 'a mixed group with a grouped operand',
      code: '!(a || (b) && c)',
    },
  ])('should not treat $group as a pure group', ({ code }) => {
    expect.assertions(1)

    expect(checkPureGroup(code)).toBe(false)
  })

  it.each([
    { code: "!(a || b === '&&')", place: 'a string' },
    { code: '!(a || /* && */ b)', place: 'a comment' },
    { place: 'a computed member key', code: '!(a || b[c && d])' },
    // eslint-disable-next-line no-template-curly-in-string
    { place: 'a template literal', code: '!(a || `${c && d}`)' },
    { place: 'a regular expression', code: '!(a || /&&/u.test(b))' },
    { place: 'a member key of a conjunction', code: '!(a && b[c || d])' },
  ])('should ignore logical operators inside $place', ({ code }) => {
    expect.assertions(1)

    expect(checkPureGroup(code)).toBe(true)
  })

  it.each([
    { layout: 'a space after the negation', code: '! (a && b || c)' },
    {
      layout: 'a comment after the negation',
      code: '!/* note */(a && b || c)',
    },
    { layout: 'double parentheses', code: '!((a && b || c))' },
    {
      layout: 'a parenthesis inside a string',
      code: "!(a && b === ')' || c)",
    },
  ])('should not treat a mixed group behind $layout as pure', ({ code }) => {
    expect.assertions(1)

    expect(checkPureGroup(code)).toBe(false)
  })
})
