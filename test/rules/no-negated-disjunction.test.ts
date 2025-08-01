import { createRuleTester } from 'eslint-vitest-rule-tester'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import rule from '../../rules/no-negated-disjunction'

describe('no-negated-disjunction', () => {
  let { invalid, valid } = createRuleTester({
    configs: {
      languageOptions: {
        parserOptions: {
          sourceType: 'module',
          ecmaVersion: 2020,
        },
      },
    },
    name: 'no-negated-disjunction',
    rule,
  })

  it('should allow simple negation', async () => {
    await valid('if (!a) {}')
  })

  it('should allow disjunction without negation', async () => {
    await valid('if (a || b) {}')
  })

  it('should allow conjunction', async () => {
    await valid('if (a && b) {}')
  })

  it('should allow bitwise NOT', async () => {
    await valid('if (~(a || b)) {}')
  })

  it('should allow negated conjunction', async () => {
    await valid('if (!(a && b)) {}')
  })

  it('should allow multiple disjunctions', async () => {
    await valid('if (a || b || c) {}')
  })

  it('should allow various declaration forms', async () => {
    await valid('const x = a || b')
    await valid('let x = a && b')
    await valid('var x = !(a && b)')
  })

  it('should allow function calls', async () => {
    await valid('foo(!a && !b)')
  })

  it('should allow arrow functions', async () => {
    await valid('const f = () => a && b')
  })

  it('should allow complex expressions with mixed operators', async () => {
    await valid('if (!(a || b && c)) {}')
    await valid('if (!(a && b || c)) {}')
    await valid('if (!((a || b) && c)) {}')
    await valid('if (!!(a || b)) {}')
    await valid('foo(!(a || !b))')
  })

  it('should transform simple negated disjunction in if statement', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'if (!(a || b)) {}',
    })

    expect(result.output).toBe('if (!a && !b) {}')
    expect(result.messages[0]).toHaveProperty(
      'message',
      'Replace negated disjunction `!(a || b)` with `!a && !b`',
    )
  })

  it('should transform negated disjunction with negated operand', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'if (!(a || !b)) {}',
    })

    expect(result.output).toBe('if (!a && b) {}')
    expect(result.messages[0]).toHaveProperty(
      'message',
      'Replace negated disjunction `!(a || !b)` with `!a && b`',
    )
  })

  it('should transform double negated disjunction', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'if (!(!a || b)) {}',
    })

    expect(result.output).toBe('if (a && !b) {}')
    expect(result.messages[0]).toHaveProperty(
      'message',
      'Replace negated disjunction `!(!a || b)` with `a && !b`',
    )
  })

  it('should transform in variable declarations', async () => {
    let { result: constResult } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'const x = !(a || b)',
    })
    expect(constResult.output).toBe('const x = !a && !b')

    let { result: letResult } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'let x = !(a || b)',
    })
    expect(letResult.output).toBe('let x = !a && !b')

    let { result: varResult } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'var x = !(a || b)',
    })
    expect(varResult.output).toBe('var x = !a && !b')
  })

  it('should transform in arrow functions', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'const f = () => !(a || b)',
    })

    expect(result.output).toBe('const f = () => !a && !b')
  })

  it('should handle comparison operators correctly', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'if (!(a || b !== c)) {}',
    })

    expect(result.output).toBe('if (!a && b === c) {}')
    expect(result.messages[0]).toHaveProperty(
      'message',
      'Replace negated disjunction `!(a || b !== c)` with `!a && b === c`',
    )
  })

  it('should preserve parentheses when needed', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'const y = (!(a || b))',
    })

    expect(result.output).toBe('const y = (!a && !b)')
  })

  it('should transform in various control structures', async () => {
    let { result: whileResult } = await invalid({
      code: 'while (!(a || b)) { doSomething(); }',
      errors: ['convertNegatedDisjunction'],
    })
    expect(whileResult.output).toBe('while (!a && !b) { doSomething(); }')

    let { result: forResult } = await invalid({
      code: 'for (; !(a || b); ) { doSomething(); }',
      errors: ['convertNegatedDisjunction'],
    })
    expect(forResult.output).toBe('for (; !a && !b; ) { doSomething(); }')

    let { result: doWhileResult } = await invalid({
      code: 'do { doSomething(); } while (!(a || b));',
      errors: ['convertNegatedDisjunction'],
    })
    expect(doWhileResult.output).toBe('do { doSomething(); } while (!a && !b);')

    let { result: ternaryResult } = await invalid({
      code: 'const result = !(a || b) ? 1 : 0;',
      errors: ['convertNegatedDisjunction'],
    })
    expect(ternaryResult.output).toBe('const result = !a && !b ? 1 : 0;')
  })

  it('should handle nested disjunctions', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'if (!(a || (b || c))) {}',
    })

    expect(result.output).toBe('if (!a && !b && !c) {}')
    expect(result.messages[0]).toHaveProperty(
      'message',
      'Replace negated disjunction `!(a || (b || c))` with `!a && !b && !c`',
    )
  })

  it('should handle multiple operands', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'if (!(a || b || c)) {}',
    })

    expect(result.output).toBe('if (!a && !b && !c) {}')
  })

  it('should handle complex nested expressions with mixed operators', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'if (!(a || (b && c))) {}',
    })

    expect(result.output).toBe('if (!a && !(b && c)) {}')
    expect(result.messages[0]).toHaveProperty(
      'message',
      'Replace negated disjunction `!(a || (b && c))` with `!a && !(b && c)`',
    )
  })

  it('should handle spacing and formatting', async () => {
    let { result: spacingResult } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'if (!(a  ||  b)) {}',
    })
    expect(spacingResult.output).toBe('if (!a  &&  !b) {}')

    let { result: multilineResult } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'if (!(a ||\n    b)) {}',
    })
    expect(multilineResult.output).toBe('if (!a &&\n    !b) {}')
  })

  it('should handle comments', async () => {
    let { result: lineCommentResult } = await invalid({
      code: 'if (!(a || // important condition\n    b)) {}',
      errors: ['convertNegatedDisjunction'],
    })
    expect(lineCommentResult.output).toBe(
      'if (!a && // important condition\n    !b) {}',
    )

    let { result: blockCommentResult } = await invalid({
      code: 'if (!(a || /* this is why we need b */ b)) {}',
      errors: ['convertNegatedDisjunction'],
    })
    expect(blockCommentResult.output).toBe(
      'if (!a && /* this is why we need b */ !b) {}',
    )
  })

  it('should handle function calls and method calls', async () => {
    let { result: functionResult } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'if (!(foo() || bar())) {}',
    })
    expect(functionResult.output).toBe('if (!foo() && !bar()) {}')

    let { result: methodResult } = await invalid({
      code: 'if (!(obj.prop || obj.method())) {}',
      errors: ['convertNegatedDisjunction'],
    })
    expect(methodResult.output).toBe('if (!obj.prop && !obj.method()) {}')
  })

  it('should handle optional chaining', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'if (!(a?.b || c?.d)) {}',
    })

    expect(result.output).toBe('if (!a?.b && !c?.d) {}')
  })

  it('should handle nullish coalescing', async () => {
    let { result } = await invalid({
      code: 'if (!((a ?? b) || (c ?? d))) {}',
      errors: ['convertNegatedDisjunction'],
    })

    expect(result.output).toBe('if (!(a ?? b) && !(c ?? d)) {}')
  })

  it('should handle instanceof operator', async () => {
    let { result } = await invalid({
      code: 'if (!(a instanceof A || b instanceof B)) {}',
      errors: ['convertNegatedDisjunction'],
    })

    expect(result.output).toBe('if (!(a instanceof A) && !(b instanceof B)) {}')
  })

  it('should handle in operator', async () => {
    let { result } = await invalid({
      code: "if (!('a' in x || 'b' in x)) {}",
      errors: ['convertNegatedDisjunction'],
    })

    expect(result.output).toBe("if (!('a' in x) && !('b' in x)) {}")
  })

  it('should handle comparison operators with negation', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'if (!(a > b || c < d)) {}',
    })

    expect(result.output).toBe('if (a <= b && c >= d) {}')
    expect(result.messages[0]).toHaveProperty(
      'message',
      'Replace negated disjunction `!(a > b || c < d)` with `a <= b && c >= d`',
    )
  })

  it('should handle complex formatting with multiline expressions', async () => {
    let { result } = await invalid({
      code: dedent`
        function func() {
          return !(
            a === b ||
            (c &&
              d(e, f))
          )
        }
      `,
      errors: ['convertNegatedDisjunction'],
    })

    expect(result.output).toBe(dedent`
      function func() {
        return a !== b &&
          !(c &&
            d(e, f))
      }
    `)
  })

  it('should work in various expression contexts', async () => {
    let { result: spreadResult } = await invalid({
      code: 'const arr = [...(!(a || b) ? [1] : [2])]',
      errors: ['convertNegatedDisjunction'],
    })
    expect(spreadResult.output).toBe('const arr = [...(!a && !b ? [1] : [2])]')

    let { result: templateResult } = await invalid({
      errors: ['convertNegatedDisjunction'],
      // eslint-disable-next-line no-template-curly-in-string
      code: 'const str = `${!(a || b)}`',
    })
    // eslint-disable-next-line no-template-curly-in-string
    expect(templateResult.output).toBe('const str = `${!a && !b}`')

    let { result: destructuringResult } = await invalid({
      code: 'const { prop = !(a || b) } = obj',
      errors: ['convertNegatedDisjunction'],
    })
    expect(destructuringResult.output).toBe('const { prop = !a && !b } = obj')
  })

  it('should handle complex nested structures', async () => {
    let { result: nestedResult1 } = await invalid({
      code: 'if (!(a || b || (c && d))) {}',
      errors: ['convertNegatedDisjunction'],
    })
    expect(nestedResult1.output).toBe('if (!a && !b && !(c && d)) {}')

    let { result: nestedResult2 } = await invalid({
      code: 'if (!(a || (b && c) || (d && e))) {}',
      errors: ['convertNegatedDisjunction'],
    })
    expect(nestedResult2.output).toBe('if (!a && !(b && c) && !(d && e)) {}')

    let { result: nestedResult3 } = await invalid({
      code: 'if (!(a || (b || c) || d)) {}',
      errors: ['convertNegatedDisjunction'],
    })
    expect(nestedResult3.output).toBe('if (!a && !b && !c && !d) {}')
  })
})
