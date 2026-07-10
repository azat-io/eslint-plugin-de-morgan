import { createRuleTester } from 'eslint-vitest-rule-tester'
import { describe, expect, it, vi } from 'vitest'
import dedent from 'dedent'

import rule from '../../rules/no-negated-conjunction'

let testerConfig = {
  configs: {
    languageOptions: {
      parserOptions: {
        sourceType: 'module' as const,
        ecmaVersion: 2022 as const,
      },
    },
  },
}

function run(source: string, values: unknown[]): unknown {
  // eslint-disable-next-line typescript/no-implied-eval, no-new-func
  let execute = new Function(
    'a',
    'b',
    'c',
    'd',
    `let r; ${source}; return r`,
  ) as (...functionArguments: unknown[]) => unknown
  return execute(...values)
}

describe('no-negated-conjunction', () => {
  let { invalid, valid } = createRuleTester({
    ...testerConfig,
    name: 'no-negated-conjunction',
    rule,
  })

  it('should allow simple negation', async () => {
    await valid('if (!a) {}')
  })

  it('should allow conjunction without negation', async () => {
    await valid('if (a && b) {}')
  })

  it('should allow disjunction', async () => {
    await valid('if (a || b) {}')
  })

  it('should allow bitwise NOT', async () => {
    await valid('if (~(a && b)) {}')
  })

  it('should allow negated disjunction', async () => {
    await valid('if (!(a || b)) {}')
  })

  it('should allow multiple conjunctions', async () => {
    await valid('if (a && b && c) {}')
  })

  it('should allow various declaration forms', async () => {
    await valid('const x = a && b')
    await valid('let x = a || b')
    await valid('var x = !(a || b)')
  })

  it('should allow function calls', async () => {
    await valid('foo(!a || !b)')
  })

  it('should allow arrow functions', async () => {
    await valid('const f = () => a || b')
  })

  it('should allow complex expressions with mixed operators', async () => {
    await valid('if (!(a && b || c)) {}')
    await valid('if (!(a || b && c)) {}')
    await valid('if (!((a && b) || c)) {}')
    await valid('foo(!(a && !b))')
  })

  it('should transform simple negated conjunction in if statement', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a && b)) {}',
    })

    expect(result.output).toBe('if (!a || !b) {}')
    expect(result.messages[0]).toHaveProperty(
      'message',
      'Replace negated conjunction `!(a && b)` with `!a || !b`',
    )
  })

  it('should transform negated conjunction with negated operand', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a && !b)) {}',
    })

    expect(result.output).toBe('if (!a || b) {}')
    expect(result.messages[0]).toHaveProperty(
      'message',
      'Replace negated conjunction `!(a && !b)` with `!a || b`',
    )
  })

  it('should transform double negated conjunction', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(!a && b)) {}',
    })

    expect(result.output).toBe('if (a || !b) {}')
    expect(result.messages[0]).toHaveProperty(
      'message',
      'Replace negated conjunction `!(!a && b)` with `a || !b`',
    )
  })

  it('should transform in variable declarations', async () => {
    let { result: constResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'const x = !(a && b)',
    })
    expect(constResult.output).toBe('const x = !a || !b')

    let { result: letResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'let x = !(a && b)',
    })
    expect(letResult.output).toBe('let x = !a || !b')

    let { result: varResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'var x = !(a && b)',
    })
    expect(varResult.output).toBe('var x = !a || !b')
  })

  it('should transform in arrow functions', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'const f = () => !(a && b)',
    })

    expect(result.output).toBe('const f = () => !a || !b')
  })

  it('should handle comparison operators correctly', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a && b !== c)) {}',
    })

    expect(result.output).toBe('if (!a || b === c) {}')
    expect(result.messages[0]).toHaveProperty(
      'message',
      'Replace negated conjunction `!(a && b !== c)` with `!a || b === c`',
    )
  })

  it('should preserve parentheses when needed', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'const y = (!(a && b))',
    })

    expect(result.output).toBe('const y = (!a || !b)')
  })

  it('should transform in various control structures', async () => {
    let { result: whileResult } = await invalid({
      code: 'while (!(a && b)) { doSomething(); }',
      errors: ['convertNegatedConjunction'],
    })
    expect(whileResult.output).toBe('while (!a || !b) { doSomething(); }')

    let { result: forResult } = await invalid({
      code: 'for (; !(a && b); ) { doSomething(); }',
      errors: ['convertNegatedConjunction'],
    })
    expect(forResult.output).toBe('for (; !a || !b; ) { doSomething(); }')

    let { result: doWhileResult } = await invalid({
      code: 'do { doSomething(); } while (!(a && b));',
      errors: ['convertNegatedConjunction'],
    })
    expect(doWhileResult.output).toBe('do { doSomething(); } while (!a || !b);')

    let { result: ternaryResult } = await invalid({
      code: 'const result = !(a && b) ? 1 : 0;',
      errors: ['convertNegatedConjunction'],
    })
    expect(ternaryResult.output).toBe('const result = !a || !b ? 1 : 0;')
  })

  it('should handle nested conjunctions', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a && (b && c))) {}',
    })

    expect(result.output).toBe('if (!a || !b || !c) {}')
    expect(result.messages[0]).toHaveProperty(
      'message',
      'Replace negated conjunction `!(a && (b && c))` with `!a || !b || !c`',
    )
  })

  it('should handle multiple operands', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a && b && c)) {}',
    })

    expect(result.output).toBe('if (!a || !b || !c) {}')
  })

  it('should handle complex nested expressions with mixed operators', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a && (b || c))) {}',
    })

    expect(result.output).toBe('if (!a || !(b || c)) {}')
    expect(result.messages[0]).toHaveProperty(
      'message',
      'Replace negated conjunction `!(a && (b || c))` with `!a || !(b || c)`',
    )
  })

  it('should handle spacing and formatting', async () => {
    let { result: spacingResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a  &&  b)) {}',
    })
    expect(spacingResult.output).toBe('if (!a  ||  !b) {}')

    let { result: multilineResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a &&\n    b)) {}',
    })
    expect(multilineResult.output).toBe('if (!a ||\n    !b) {}')
  })

  it('should handle comments', async () => {
    let { result: lineCommentResult } = await invalid({
      code: 'if (!(a && // important condition\n    b)) {}',
      errors: ['convertNegatedConjunction'],
    })
    expect(lineCommentResult.output).toBe(
      'if (!a || // important condition\n    !b) {}',
    )

    let { result: blockCommentResult } = await invalid({
      code: 'if (!(a && /* this is why we need b */ b)) {}',
      errors: ['convertNegatedConjunction'],
    })
    expect(blockCommentResult.output).toBe(
      'if (!a || /* this is why we need b */ !b) {}',
    )
  })

  it('should handle function calls and method calls', async () => {
    let { result: functionResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(foo() && bar())) {}',
    })
    expect(functionResult.output).toBe('if (!foo() || !bar()) {}')

    let { result: methodResult } = await invalid({
      code: 'if (!(obj.prop && obj.method())) {}',
      errors: ['convertNegatedConjunction'],
    })
    expect(methodResult.output).toBe('if (!obj.prop || !obj.method()) {}')
  })

  it('should handle optional chaining', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a?.b && c?.d)) {}',
    })

    expect(result.output).toBe('if (!a?.b || !c?.d) {}')
  })

  it('should handle nullish coalescing', async () => {
    let { result } = await invalid({
      code: 'if (!((a ?? b) && (c ?? d))) {}',
      errors: ['convertNegatedConjunction'],
    })

    expect(result.output).toBe('if (!(a ?? b) || !(c ?? d)) {}')
  })

  it('should handle instanceof operator', async () => {
    let { result } = await invalid({
      code: 'if (!(a instanceof A && b instanceof B)) {}',
      errors: ['convertNegatedConjunction'],
    })

    expect(result.output).toBe('if (!(a instanceof A) || !(b instanceof B)) {}')
  })

  it('should handle comparison operators with negation', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a > b && c < d)) {}',
    })

    expect(result.output).toBe('if (!(a > b) || !(c < d)) {}')
    expect(result.messages[0]).toHaveProperty(
      'message',
      'Replace negated conjunction `!(a > b && c < d)` with `!(a > b) || !(c < d)`',
    )
  })

  it('should preserve parentheses of sub-operands in wrapped comparisons', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a < (x = y) && d)) {}',
    })

    expect(result.output).toBe('if (!(a < (x = y)) || !d) {}')
  })

  it('should preserve comments inside wrapped comparisons', async () => {
    let { result } = await invalid({
      code: 'if (!(a /* keep */ < b && c)) {}',
      errors: ['convertNegatedConjunction'],
    })

    expect(result.output).toBe('if (!(a /* keep */ < b) || !c) {}')
  })

  it('should preserve parentheses of sub-operands when toggling equality operators', async () => {
    let { result: logicalResult } = await invalid({
      code: 'if (!((a || b) === c && d)) {}',
      errors: ['convertNegatedConjunction'],
    })
    expect(logicalResult.output).toBe('if ((a || b) !== c || !d) {}')

    let { result: bitmaskResult } = await invalid({
      code: 'if (!((flags & 4) === 0 && x)) {}',
      errors: ['convertNegatedConjunction'],
    })
    expect(bitmaskResult.output).toBe('if ((flags & 4) !== 0 || !x) {}')

    let { result: assignmentResult } = await invalid({
      code: 'if (!((a = b) === c && d)) {}',
      errors: ['convertNegatedConjunction'],
    })
    expect(assignmentResult.output).toBe('if ((a = b) !== c || !d) {}')

    let { result: nullishResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: '!((a ?? b) === c && d)',
    })
    expect(nullishResult.output).toBe('(a ?? b) !== c || !d')
  })

  it('should preserve comments inside toggled comparisons', async () => {
    let { result } = await invalid({
      code: 'if (!(a /* keep */ === b && c)) {}',
      errors: ['convertNegatedConjunction'],
    })

    expect(result.output).toBe('if (a /* keep */ !== b || !c) {}')
  })

  it('should wrap parenthesized low-precedence operands in negation', async () => {
    let { result: ternaryResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a && (b ? c : d))) {}',
    })
    expect(ternaryResult.output).toBe('if (!a || !(b ? c : d)) {}')

    let { result: sequenceResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a && (b, c))) {}',
    })
    expect(sequenceResult.output).toBe('if (!a || !(b, c)) {}')

    let { result: negatedSequenceResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a && (!b, c))) {}',
    })
    expect(negatedSequenceResult.output).toBe('if (!a || !(!b, c)) {}')

    let { result: assignmentResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a && (b = c))) {}',
    })
    expect(assignmentResult.output).toBe('if (!a || !(b = c)) {}')

    let { result: logicalAssignmentResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a && (b &&= c))) {}',
    })
    expect(logicalAssignmentResult.output).toBe('if (!a || !(b &&= c)) {}')

    let { result: arrowResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'if (!(a && (x => x))) {}',
    })
    expect(arrowResult.output).toBe('if (!a || !(x => x)) {}')

    let { result: yieldResult } = await invalid({
      code: 'function* g(a) { if (!(a && (yield))) {} }',
      errors: ['convertNegatedConjunction'],
    })
    expect(yieldResult.output).toBe('function* g(a) { if (!a || !(yield)) {} }')
  })

  it('should handle complex formatting with multiline expressions', async () => {
    let { result } = await invalid({
      code: dedent`
        function func() {
          return !(
            a === b &&
            (c ||
              d(e, f))
          )
        }
      `,
      errors: ['convertNegatedConjunction'],
    })

    expect(result.output).toBe(dedent`
      function func() {
        return a !== b ||
          !(c ||
            d(e, f))
      }
    `)
  })

  it('should preserve balanced parentheses for multiline grouped disjunctions', async () => {
    let { result } = await invalid({
      code: dedent`
        function f(a, b, c, d) {
          return !(
            (a || b) &&
            (c || d)
          )
        }
      `,
      errors: ['convertNegatedConjunction'],
    })

    expect(result.output).toBe(dedent`
      function f(a, b, c, d) {
        return !(a || b) ||
          !(c || d)
      }
    `)
  })

  it('should work in various expression contexts', async () => {
    let { result: spreadResult } = await invalid({
      code: 'const arr = [...(!(a && b) ? [1] : [2])]',
      errors: ['convertNegatedConjunction'],
    })
    expect(spreadResult.output).toBe('const arr = [...(!a || !b ? [1] : [2])]')

    let { result: templateResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      // eslint-disable-next-line no-template-curly-in-string
      code: 'const str = `${!(a && b)}`',
    })
    // eslint-disable-next-line no-template-curly-in-string
    expect(templateResult.output).toBe('const str = `${!a || !b}`')

    let { result: destructuringResult } = await invalid({
      code: 'const { prop = !(a && b) } = obj',
      errors: ['convertNegatedConjunction'],
    })
    expect(destructuringResult.output).toBe('const { prop = !a || !b } = obj')
  })

  it('should preserve runtime behavior when relational operands are NaN', async () => {
    let code = 'if (!(a < b && c)) { r = 1 } else { r = 2 }'
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code,
    })

    expect(run(result.output, [Number.NaN, 1, true])).toBe(
      run(code, [Number.NaN, 1, true]),
    )
    expect(run(result.output, [undefined, 1, true])).toBe(
      run(code, [undefined, 1, true]),
    )
  })

  it('should preserve runtime behavior for parenthesized low-precedence operands', async () => {
    let ternaryCode = 'if (!(a && (b ? c : d))) { r = 1 } else { r = 2 }'
    let { result: ternaryResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: ternaryCode,
    })
    expect(run(ternaryResult.output, [false, true, 0, 1])).toBe(
      run(ternaryCode, [false, true, 0, 1]),
    )

    let sequenceCode = 'if (!(a && (b, c))) { r = 1 } else { r = 2 }'
    let { result: sequenceResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: sequenceCode,
    })
    expect(run(sequenceResult.output, [true, true, false])).toBe(
      run(sequenceCode, [true, true, false]),
    )

    let assignmentCode = 'if (!(a && (b = c))) { r = 1 } else { r = 2 }'
    let { result: assignmentResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: assignmentCode,
    })
    expect(run(assignmentResult.output, [true, true, false])).toBe(
      run(assignmentCode, [true, true, false]),
    )

    let arrowCode = 'if (!(a && (x => x))) { r = 1 } else { r = 2 }'
    let { result: arrowResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: arrowCode,
    })
    expect(run(arrowResult.output, [true])).toBe(run(arrowCode, [true]))

    let negatedSequenceCode = 'if (!(a && (!b, c))) { r = 1 } else { r = 2 }'
    let { result: negatedSequenceResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: negatedSequenceCode,
    })
    expect(run(negatedSequenceResult.output, [true, false, false])).toBe(
      run(negatedSequenceCode, [true, false, false]),
    )
  })

  it('should preserve runtime behavior for parenthesized yield operands', async () => {
    let code =
      'function* g(a) { if (!(a && (yield))) { r = 1 } else { r = 2 } }'
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code,
    })

    function runGenerator(source: string): unknown {
      // eslint-disable-next-line typescript/no-implied-eval, no-new-func
      let execute = new Function(
        `let r; ${source}; let iterator = g(true); iterator.next(); iterator.next(false); return r`,
      ) as () => unknown
      return execute()
    }

    expect(runGenerator(result.output)).toBe(runGenerator(code))
  })

  it('should preserve runtime behavior when the fixed expression has a parent operator', async () => {
    let nullishCode = 'r = c ?? !(a && b)'
    let { result: nullishResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: nullishCode,
    })
    expect(run(nullishResult.output, [true, true, null])).toBe(
      run(nullishCode, [true, true, null]),
    )

    let comparisonCode = 'r = !(a && b) === c'
    let { result: comparisonResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: comparisonCode,
    })
    expect(run(comparisonResult.output, [false, false, false])).toBe(
      run(comparisonCode, [false, false, false]),
    )

    let inCode = 'r = !(a && b) in c'
    let { result: inResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: inCode,
    })
    expect(run(inResult.output, [false, false, {}])).toBe(
      run(inCode, [false, false, {}]),
    )

    let unaryMinusCode = 'r = -!(a && b)'
    let { result: unaryMinusResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: unaryMinusCode,
    })
    expect(run(unaryMinusResult.output, [true, true])).toBe(
      run(unaryMinusCode, [true, true]),
    )

    let additionCode = 'r = 1 + !(a && b)'
    let { result: additionResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: additionCode,
    })
    expect(run(additionResult.output, [true, false])).toBe(
      run(additionCode, [true, false]),
    )

    let voidCode = 'r = void !(a && b)'
    let { result: voidResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: voidCode,
    })
    expect(run(voidResult.output, [true, false])).toBe(
      run(voidCode, [true, false]),
    )

    let indexCode = 'r = c[+!(a && b)]'
    let { result: indexResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: indexCode,
    })
    expect(run(indexResult.output, [true, true, ['first', 'second']])).toBe(
      run(indexCode, [true, true, ['first', 'second']]),
    )
  })

  it('should preserve runtime behavior in statement-level parent contexts', async () => {
    let newlineCode = 'r = c\n!(a && b) && d'
    let { result: newlineResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: newlineCode,
    })
    expect(run(newlineResult.output, [true, true, 5, false])).toBe(
      run(newlineCode, [true, true, 5, false]),
    )

    let statementCode = 'r = 1; !(function(){} === b && c); r = 2'
    let { result: statementResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: statementCode,
    })
    expect(run(statementResult.output, [0, 5, true])).toBe(
      run(statementCode, [0, 5, true]),
    )

    let forInitCode =
      'for (var i = !(a == b in c && d); i; i = false) { r = 1 }'
    let { result: forInitResult } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: forInitCode,
    })
    expect(run(forInitResult.output, [true, 'k', {}, true])).toBe(
      run(forInitCode, [true, 'k', {}, true]),
    )
  })

  it('should skip reporting when transform cannot produce a fix', async () => {
    vi.resetModules()

    let transformMock = vi.fn().mockReturnValue(null)

    vi.doMock('../../utils/transform', () => ({
      transform: transformMock,
    }))

    try {
      let { default: mockedRule } =
        await import('../../rules/no-negated-conjunction')
      let { valid: validRule } = createRuleTester({
        ...testerConfig,
        name: 'no-negated-conjunction transform fallback',
        rule: mockedRule,
      })

      await validRule('if (!(a && b)) {}')

      expect(transformMock).toHaveBeenCalledWith(
        expect.objectContaining({ expressionType: 'conjunction' }),
      )
    } finally {
      vi.doUnmock('../../utils/transform')
      vi.resetModules()
    }
  })
})
