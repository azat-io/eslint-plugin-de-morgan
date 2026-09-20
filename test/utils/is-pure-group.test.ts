import type { Rule } from 'eslint'

import { describe, expect, it } from 'vitest'
import { Linter } from 'eslint'

import { isPureGroup } from '../../utils/is-pure-group'

let linter = new Linter()

function checkPureGroup(code: string): boolean {
  let results: boolean[] = []
  let rule: Rule.RuleModule = {
    create: context => ({
      UnaryExpression: node => {
        results.push(isPureGroup(node, context))
      },
    }),
  }

  linter.verify(code, {
    plugins: { test: { rules: { 'is-pure-group': rule } } },
    rules: { 'test/is-pure-group': 'error' },
  })

  let [result] = results
  if (result === undefined) {
    throw new Error(`Expected a negated expression in: ${code}`)
  }
  return result
}

describe('isPureGroup', () => {
  it('should return true for a group with a single logical operator', () => {
    expect.assertions(3)

    expect(checkPureGroup('!(a && b)')).toBeTruthy()
    expect(checkPureGroup('!(a || b || c)')).toBeTruthy()
    expect(checkPureGroup('!a')).toBeTruthy()
  })

  it('should return false for a group with mixed logical operators', () => {
    expect.assertions(3)

    expect(checkPureGroup('!(a && b || c)')).toBeFalsy()
    expect(checkPureGroup('!(a || b && c)')).toBeFalsy()
    expect(checkPureGroup('!(a || b && c || d)')).toBeFalsy()
  })

  it('should treat parenthesized operands as separate groups', () => {
    expect.assertions(4)

    expect(checkPureGroup('!((a && b) || c)')).toBeTruthy()
    expect(checkPureGroup('!(a || (b && c))')).toBeTruthy()
    expect(checkPureGroup('!(a || (b || c && d))')).toBeTruthy()
    expect(checkPureGroup('!(a || (b) && c)')).toBeFalsy()
  })

  it('should ignore operators outside of logical expressions', () => {
    expect.assertions(6)

    expect(checkPureGroup("!(a || b === '&&')")).toBeTruthy()
    expect(checkPureGroup('!(a || /* && */ b)')).toBeTruthy()
    expect(checkPureGroup('!(a || b[c && d])')).toBeTruthy()
    // eslint-disable-next-line no-template-curly-in-string
    expect(checkPureGroup('!(a || `${c && d}`)')).toBeTruthy()
    expect(checkPureGroup('!(a || /&&/u.test(b))')).toBeTruthy()
    expect(checkPureGroup('!(a && b[c || d])')).toBeTruthy()
  })

  it('should not depend on the formatting around the negated group', () => {
    expect.assertions(4)

    expect(checkPureGroup('! (a && b || c)')).toBeFalsy()
    expect(checkPureGroup('!/* note */(a && b || c)')).toBeFalsy()
    expect(checkPureGroup('!((a && b || c))')).toBeFalsy()
    expect(checkPureGroup("!(a && b === ')' || c)")).toBeFalsy()
  })
})
