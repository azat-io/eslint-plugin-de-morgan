import { createRuleTester } from 'eslint-vitest-rule-tester'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import conjunctionRule from '../../rules/no-negated-conjunction'
import { evaluateFixture } from '../helpers/evaluate-fixture'
import { testerConfig } from '../helpers/tester-config'
import rule from '../../rules/no-negated-disjunction'

describe('no-negated-disjunction', () => {
  let { invalid, valid } = createRuleTester({
    ...testerConfig,
    name: 'no-negated-disjunction',
    rule,
  })

  it.each([
    { situation: 'a negated identifier', code: 'if (!a) {}' },
    { situation: 'a bitwise NOT of a disjunction', code: 'if (~(a || b)) {}' },
    { situation: 'a negated conjunction', code: 'if (!(a && b)) {}' },
    {
      situation: 'a conjunction of a grouped disjunction',
      code: 'if (!((a || b) && c)) {}',
    },
    // Pinned current behavior that the docs do not describe yet: a double
    // Negation is left alone, and so is a group that already holds a
    // Negation outside a boolean context.
    {
      situation: 'a double negation of a disjunction',
      code: 'if (!!(a || b)) {}',
    },
    { situation: 'a value group holding a negation', code: 'foo(!(a || !b))' },
  ])('should not report $situation', async ({ code }) => {
    await valid(code)
  })

  it.each([
    {
      layout: 'that ends with a conjunction',
      code: 'if (!(a || b && c)) {}',
    },
    {
      layout: 'that starts with a conjunction',
      code: 'if (!(a && b || c)) {}',
    },
    {
      layout: 'with a space after the negation',
      code: 'if (! (a && b || c)) {}',
    },
    {
      layout: 'with a comment after the negation',
      code: 'if (!/* note */(a && b || c)) {}',
    },
    {
      code: 'if (!((a && b || c))) {}',
      layout: 'in double parentheses',
    },
    {
      layout: 'with a parenthesis inside a string',
      code: "if (!(a && b === ')' || c)) {}",
    },
  ])(
    'should not report a negated disjunction that mixes in a conjunction $layout',
    async ({ code }) => {
      await valid(code)
    },
  )

  it('should not report mixed operators when enforcing them is turned off explicitly', async () => {
    await valid({
      options: [{ enforceForMixedOperators: false }],
      code: 'if (!(a && b || c)) {}',
    })
  })

  it.each([
    {
      output: 'if (!a && !b) {}',
      context: 'an if condition',
      code: 'if (!(a || b)) {}',
    },
    {
      context: 'a const declaration',
      output: 'const x = !a && !b',
      code: 'const x = !(a || b)',
    },
    {
      context: 'a let declaration',
      output: 'let x = !a && !b',
      code: 'let x = !(a || b)',
    },
    {
      context: 'a var declaration',
      output: 'var x = !a && !b',
      code: 'var x = !(a || b)',
    },
    {
      output: 'const f = () => !a && !b',
      code: 'const f = () => !(a || b)',
      context: 'an arrow function body',
    },
    {
      context: 'a parenthesized initializer',
      output: 'const y = (!a && !b)',
      code: 'const y = (!(a || b))',
    },
    {
      output: 'while (!a && !b) { doSomething(); }',
      code: 'while (!(a || b)) { doSomething(); }',
      context: 'a while condition',
    },
    {
      output: 'for (; !a && !b; ) { doSomething(); }',
      code: 'for (; !(a || b); ) { doSomething(); }',
      context: 'a for condition',
    },
    {
      output: 'do { doSomething(); } while (!a && !b);',
      code: 'do { doSomething(); } while (!(a || b));',
      context: 'a do-while condition',
    },
    {
      output: 'const result = !a && !b ? 1 : 0;',
      code: 'const result = !(a || b) ? 1 : 0;',
      context: 'a conditional test',
    },
    {
      output: 'const arr = [...(!a && !b ? [1] : [2])]',
      code: 'const arr = [...(!(a || b) ? [1] : [2])]',
      context: 'a conditional test inside a spread',
    },
    {
      // eslint-disable-next-line no-template-curly-in-string
      output: 'const str = `${!a && !b}`',
      // eslint-disable-next-line no-template-curly-in-string
      code: 'const str = `${!(a || b)}`',
      context: 'a template literal',
    },
    {
      output: 'const { prop = !a && !b } = obj',
      code: 'const { prop = !(a || b) } = obj',
      context: 'a destructuring default',
    },
  ])(
    'should rewrite a negated disjunction in $context',
    async ({ output, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedDisjunction'],
        code,
      })

      expect(result.output).toBe(output)
    },
  )

  it.each([
    {
      operands: 'a negated last operand',
      code: 'if (!(a || !b)) {}',
      output: 'if (!a && b) {}',
    },
    {
      operands: 'a negated first operand',
      code: 'if (!(!a || b)) {}',
      output: 'if (a && !b) {}',
    },
    {
      output: 'if (!a && b === c) {}',
      code: 'if (!(a || b !== c)) {}',
      operands: 'an inequality',
    },
    {
      output: 'if (!a && !b && !c) {}',
      code: 'if (!(a || b || c)) {}',
      operands: 'three operands',
    },
    {
      operands: 'a grouped disjunction',
      output: 'if (!a && !b && !c) {}',
      code: 'if (!(a || (b || c))) {}',
    },
    {
      operands: 'a grouped disjunction in the middle',
      output: 'if (!a && !b && !c && !d) {}',
      code: 'if (!(a || (b || c) || d)) {}',
    },
    {
      operands: 'a grouped conjunction',
      output: 'if (!a && !(b && c)) {}',
      code: 'if (!(a || (b && c))) {}',
    },
    {
      operands: 'a trailing grouped conjunction',
      output: 'if (!a && !b && !(c && d)) {}',
      code: 'if (!(a || b || (c && d))) {}',
    },
    {
      output: 'if (!a && !(b && c) && !(d && e)) {}',
      code: 'if (!(a || (b && c) || (d && e))) {}',
      operands: 'two grouped conjunctions',
    },
    {
      output: 'if (!foo() && !bar()) {}',
      code: 'if (!(foo() || bar())) {}',
      operands: 'function calls',
    },
    {
      output: 'if (!obj.prop && !obj.method()) {}',
      code: 'if (!(obj.prop || obj.method())) {}',
      operands: 'a property and a method call',
    },
    {
      output: 'if (!a?.b && !c?.d) {}',
      code: 'if (!(a?.b || c?.d)) {}',
      operands: 'optional chains',
    },
    {
      output: 'if (!(a ?? b) && !(c ?? d)) {}',
      code: 'if (!((a ?? b) || (c ?? d))) {}',
      operands: 'grouped nullish coalescing',
    },
    {
      output: 'if (!(a instanceof A) && !(b instanceof B)) {}',
      code: 'if (!(a instanceof A || b instanceof B)) {}',
      operands: 'instanceof checks',
    },
    {
      output: "if (!('a' in x) && !('b' in x)) {}",
      code: "if (!('a' in x || 'b' in x)) {}",
      operands: 'in checks',
    },
    {
      output: 'if (!(a > b) && !(c < d)) {}',
      operands: 'relational comparisons',
      code: 'if (!(a > b || c < d)) {}',
    },
    {
      operands: 'a comparison with a grouped assignment',
      output: 'if (!(a < (x = y)) && !d) {}',
      code: 'if (!(a < (x = y) || d)) {}',
    },
    {
      operands: 'a comparison with a comment inside',
      output: 'if (!(a /* keep */ < b) && !c) {}',
      code: 'if (!(a /* keep */ < b || c)) {}',
    },
    {
      operands: 'an equality with a grouped disjunction',
      output: 'if ((a || b) !== c && !d) {}',
      code: 'if (!((a || b) === c || d)) {}',
    },
    {
      operands: 'an equality with a grouped bitmask',
      output: 'if ((flags & 4) !== 0 && !x) {}',
      code: 'if (!((flags & 4) === 0 || x)) {}',
    },
    {
      operands: 'an equality with a grouped assignment',
      output: 'if ((a = b) !== c && !d) {}',
      code: 'if (!((a = b) === c || d)) {}',
    },
    {
      operands: 'an equality with grouped nullish',
      code: '!((a ?? b) === c || d)',
      output: '(a ?? b) !== c && !d',
    },
    {
      operands: 'an equality with a comment inside',
      output: 'if (a /* keep */ !== b && !c) {}',
      code: 'if (!(a /* keep */ === b || c)) {}',
    },
    {
      output: 'if (!a && !(b ? c : d)) {}',
      code: 'if (!(a || (b ? c : d))) {}',
      operands: 'a grouped conditional',
    },
    {
      output: 'if (!a && !(b, c)) {}',
      operands: 'a grouped sequence',
      code: 'if (!(a || (b, c))) {}',
    },
    {
      operands: 'a grouped assignment',
      output: 'if (!a && !(b = c)) {}',
      code: 'if (!(a || (b = c))) {}',
    },
    {
      operands: 'a grouped logical assignment',
      output: 'if (!a && !(b &&= c)) {}',
      code: 'if (!(a || (b &&= c))) {}',
    },
    {
      operands: 'a grouped arrow function',
      output: 'if (!a && !(x => x)) {}',
      code: 'if (!(a || (x => x))) {}',
    },
  ])(
    'should rewrite a negated disjunction with $operands',
    async ({ output, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedDisjunction'],
        code,
      })

      expect(result.output).toBe(output)
    },
  )

  it.each([
    {
      output: "if (!a && b !== '&&') {}",
      code: "if (!(a || b === '&&')) {}",
      place: 'a string',
    },
    {
      output: 'if (!a && /* && */ !b) {}',
      code: 'if (!(a || /* && */ b)) {}',
      place: 'a comment',
    },
    {
      place: 'a comment that repeats the group',
      output: 'if (!a && /* a || b */ !b) {}',
      code: 'if (!(a || /* a || b */ b)) {}',
    },
    {
      output: 'if (!a && !b[c && d]) {}',
      code: 'if (!(a || b[c && d])) {}',
      place: 'a computed member key',
    },
    {
      // eslint-disable-next-line no-template-curly-in-string
      output: 'if (!a && !`${c && d}`) {}',
      // eslint-disable-next-line no-template-curly-in-string
      code: 'if (!(a || `${c && d}`)) {}',
      place: 'a template literal',
    },
    {
      output: 'if (!a && !/&&/u.test(b)) {}',
      code: 'if (!(a || /&&/u.test(b))) {}',
      place: 'a regular expression',
    },
  ])(
    'should leave logical operators inside $place unchanged',
    async ({ output, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedDisjunction'],
        code,
      })

      expect(result.output).toBe(output)
    },
  )

  it.each([
    {
      layout: 'extra spaces around the operator',
      output: 'if (!a  &&  !b) {}',
      code: 'if (!(a  ||  b)) {}',
    },
    {
      layout: 'a line break after the operator',
      output: 'if (!a &&\n    !b) {}',
      code: 'if (!(a ||\n    b)) {}',
    },
    {
      code: dedent`
        function func() {
          return !(
            a === b ||
            (c &&
              d(e, f))
          )
        }
      `,
      output: dedent`
        function func() {
          return a !== b &&
            !(c &&
              d(e, f))
        }
      `,
      layout: 'a nested multiline operand',
    },
    {
      code: dedent`
        function f(a, b, c, d) {
          return !(
            (a && b) ||
            (c && d)
          )
        }
      `,
      output: dedent`
        function f(a, b, c, d) {
          return !(a && b) &&
            !(c && d)
        }
      `,
      layout: 'multiline grouped conjunctions',
    },
  ])('should keep $layout', async ({ output, code }) => {
    let { result } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code,
    })

    expect(result.output).toBe(output)
  })

  it.each([
    {
      output: 'if (!a && // important condition\n    !b) {}',
      code: 'if (!(a || // important condition\n    b)) {}',
      position: 'after the operator',
    },
    {
      output: 'if (!a && /* this is why we need b */ !b) {}',
      code: 'if (!(a || /* this is why we need b */ b)) {}',
      position: 'before the second operand',
    },
    {
      position: 'inside a grouped right operand',
      output: 'const x = !a && !(/* keep */ b)',
      code: 'const x = !(a || (/* keep */ b))',
    },
    {
      output: 'const x = !(a /* keep */) && !b',
      position: 'inside a grouped left operand',
      code: 'const x = !((a /* keep */) || b)',
    },
    {
      position: 'on its own line inside a grouped operand',
      output: 'const x = !a && !(// keep\n  b)',
      code: 'const x = !(a || (// keep\n  b))',
    },
    {
      position: 'after the opening parenthesis',
      output: 'if (/* note */ !a && !b) {}',
      code: 'if (!(/* note */ a || b)) {}',
    },
    {
      position: 'before the closing parenthesis',
      output: 'if (!a && !b /* note */) {}',
      code: 'if (!(a || b /* note */)) {}',
    },
    {
      position: 'between the negation and the parenthesis',
      output: 'if (/* note */!a && !b) {}',
      code: 'if (!/* note */(a || b)) {}',
    },
    {
      position: 'between nested grouping parentheses',
      code: 'if (!(/* note */ (a || b))) {}',
      output: 'if (/* note */ !a && !b) {}',
    },
    {
      code: dedent`
        if (
          !(
            // why
            a ||
            b
          )
        ) {}
      `,
      output: dedent`
        if (
          // why
            !a &&
            !b
        ) {}
      `,
      position: 'on its own line before the operands',
    },
    {
      code: dedent`
        if (
          !(
            a ||
            b // why
          )
        ) {}
      `,
      output: dedent`
        if (
          !a &&
            !b // why
        ) {}
      `,
      position: 'at the end of the last operand line',
    },
    {
      position: 'at a line end before more code',
      output: 'if (!a && !b // why\n) {}',
      code: 'if (!(a || b // why\n)) {}',
    },
    {
      position: 'at the end of the file',
      output: 'x = !a && !b // why\n',
      code: 'x = !(a || b // why\n)',
    },
    {
      output: 'if (!a && !b // why\n /* see\n */ && c) {}',
      code: 'if (!(a || b // why\n) /* see\n */ && c) {}',
      position: 'at a line end before another comment',
    },
    {
      position: 'when the fix is wrapped in parentheses',
      output: 'r = (/* note */ !a && !b // why\n) === c',
      code: 'r = !(/* note */ a || b // why\n) === c',
    },
    {
      position: 'before a closing parenthesis below',
      code: 'if (!(a || b /* note */\n)) {}',
      output: 'if (!a && !b /* note */) {}',
    },
    {
      position: 'touching the first operand',
      output: 'if (/* note */!a && !b) {}',
      code: 'if (!(/* note */a || b)) {}',
    },
    {
      position: 'touching the last operand',
      output: 'if (!a && !b/* note */) {}',
      code: 'if (!(a || b/* note */)) {}',
    },
    {
      position: 'in a pair after the opening parenthesis',
      output: 'if (/* first */ /* second */ !a && !b) {}',
      code: 'if (!(/* first */ /* second */ a || b)) {}',
    },
    {
      position: 'in a pair before the closing parenthesis',
      output: 'if (!a && !b /* first */ /* second */) {}',
      code: 'if (!(a || b /* first */ /* second */)) {}',
    },
    {
      position: 'after a nested closing parenthesis',
      code: 'if (!((a || b) /* note */)) {}',
      output: 'if (!a && !b /* note */) {}',
    },
    {
      position: 'at a line end of a wrapped result',
      output: 'r = (!a && !b // why\n)\n  === c',
      code: 'r = !(a || b // why\n)\n  === c',
    },
  ])('should keep a comment $position', async ({ output, code }) => {
    let { result } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code,
    })

    expect(result.output).toBe(output)
  })

  it.each([
    {
      code: dedent`
        function f() {
          return !(
            // why
            a || b
          )
        }
      `,
      output: dedent`
        function f() {
          return (// why
            !a && !b)
        }
      `,
      keyword: 'return',
    },
    {
      output: 'throw (/* first line\n second line */ !a && !b)',
      code: 'throw !(/* first line\n second line */ a || b)',
      keyword: 'throw',
    },
    {
      output: 'function* g() { yield (// why\n !a && !b) }',
      code: 'function* g() { yield !(// why\n a || b) }',
      keyword: 'yield',
    },
  ])(
    'should parenthesize the argument of $keyword when a comment with a line break moves before it',
    async ({ output, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedDisjunction'],
        code,
      })

      expect(result.output).toBe(output)
    },
  )

  it.each([
    {
      output: 'r = (function () { return (// why\n!a && !b) && c })()',
      code: 'r = (function () { return !(\n// why\na || b) && c })()',
      position: 'only starts the returned expression',
    },
    {
      output: 'r = (function () { return /* note */ (// why\n!a && !b) })()',
      code: 'r = (function () { return /* note */ !(\n// why\na || b) })()',
      position: 'follows a comment after return',
    },
    {
      output: 'r = (function () { return (// why\n!a && !b // because\n)\n})()',
      code: 'r = (function () { return !(\n// why\na || b // because\n)\n})()',
      position: 'also ends with a line comment',
    },
  ])(
    'should rewrite an argument that $position and keep the returned value when a comment with a line break moves before it',
    async ({ output, code }) => {
      let values = [true, false, true]

      let { result } = await invalid({
        errors: ['convertNegatedDisjunction'],
        code,
      })

      expect(result.output).toBe(output)
      expect(evaluateFixture(result.output, values)).toBe(
        evaluateFixture(code, values),
      )
    },
  )

  it('should not parenthesize the argument of return when the moved comment has no line break', async () => {
    let { result } = await invalid({
      code: 'function f() { return !(/* note */ a || b) }',
      errors: ['convertNegatedDisjunction'],
    })

    expect(result.output).toBe('function f() { return /* note */ !a && !b }')
  })

  it.each([
    {
      output: '(/* note */ function () {} !== b && !c)',
      code: '!(/* note */ function () {} === b || c)',
      comment: 'a block comment',
    },
    {
      output: '(// note\n function () {} !== b && !c)',
      code: '!(// note\n function () {} === b || c)',
      comment: 'a line comment',
    },
    {
      output: '(/* first */ function () {} !== b && !c /* last */)',
      code: '!(/* first */ function () {} === b || c /* last */)',
      comment: 'the first of several block comments',
    },
  ])(
    'should parenthesize a statement whose fix starts with a function after $comment',
    async ({ output, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedDisjunction'],
        code,
      })

      expect(result.output).toBe(output)
    },
  )

  it.each([
    {
      output: '(function () {} !== b && !c // why\n)\nfoo()',
      code: '!(function () {} === b || c // why\n)\nfoo()',
      comments: 'a trailing line comment',
    },
    {
      output: '(/* note */ function () {} !== b && !c // why\n)\nfoo()',
      code: '!(/* note */ function () {} === b || c // why\n)\nfoo()',
      comments: 'a leading and a trailing comment',
    },
  ])(
    'should keep the closing parenthesis of a statement out of the last comment when the expression has $comments',
    async ({ output, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedDisjunction'],
        code,
      })

      expect(result.output).toBe(output)
    },
  )

  it('should not withhold the fix of a statement because it starts with a comment', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code: 'r = c\n!(/* note */ a || b)',
    })

    expect(result.output).toBe('r = c\n/* note */ !a && !b')
  })

  it.each([
    {
      code: 'r = c\n!(/* note */ (x).y === 1 || b)',
      start: 'a parenthesis',
    },
    {
      code: 'r = c\n!(/* note */ function () {} === b || c)',
      start: 'a function',
    },
  ])(
    'should withhold the fix of a statement when the fix starts with $start after a comment and could merge with the previous line',
    async ({ code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedDisjunction'],
        code,
      })

      expect(result.output).toBe(code)
    },
  )

  it('should withhold the fix of a statement whose parenthesized fix could merge with the previous line', async () => {
    let code = 'r = c\n!(a || b) === d'

    let { result } = await invalid({
      errors: ['convertNegatedDisjunction'],
      code,
    })

    expect(result.output).toBe(code)
  })

  it.each([
    {
      message: 'Replace negated disjunction `!(a || b)` with `!a && !b`',
      operands: 'two plain operands',
      code: 'if (!(a || b)) {}',
    },
    {
      message: 'Replace negated disjunction `!(a || !b)` with `!a && b`',
      operands: 'a negated last operand',
      code: 'if (!(a || !b)) {}',
    },
    {
      message: 'Replace negated disjunction `!(!a || b)` with `a && !b`',
      operands: 'a negated first operand',
      code: 'if (!(!a || b)) {}',
    },
    {
      message:
        'Replace negated disjunction `!(a || b !== c)` with `!a && b === c`',
      code: 'if (!(a || b !== c)) {}',
      operands: 'an inequality',
    },
    {
      message:
        'Replace negated disjunction `!(a || (b || c))` with `!a && !b && !c`',
      operands: 'a grouped disjunction',
      code: 'if (!(a || (b || c))) {}',
    },
    {
      message:
        'Replace negated disjunction `!(a || (b && c))` with `!a && !(b && c)`',
      operands: 'a grouped conjunction',
      code: 'if (!(a || (b && c))) {}',
    },
    {
      message:
        'Replace negated disjunction `!(a > b || c < d)` with `!(a > b) && !(c < d)`',
      operands: 'relational comparisons',
      code: 'if (!(a > b || c < d)) {}',
    },
  ])(
    'should show the original and the fixed disjunction with $operands in the message',
    async ({ message, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedDisjunction'],
        code,
      })

      expect(result.messages[0]).toHaveProperty('message', message)
    },
  )

  it.each([
    {
      output: 'if (!(a < b) && !c) { r = 1 } else { r = 2 }',
      code: 'if (!(a < b || c)) { r = 1 } else { r = 2 }',
      situation: 'a relational comparison with NaN',
      values: [Number.NaN, 1, false],
    },
    {
      output: 'if (!(a < b) && !c) { r = 1 } else { r = 2 }',
      code: 'if (!(a < b || c)) { r = 1 } else { r = 2 }',
      situation: 'a relational comparison with undefined',
      values: [undefined, 1, false],
    },
    {
      output: 'if (!a && !(b ? c : d)) { r = 1 } else { r = 2 }',
      code: 'if (!(a || (b ? c : d))) { r = 1 } else { r = 2 }',
      situation: 'a grouped conditional operand',
      values: [true, false, 0, 1],
    },
    {
      output: 'if (!a && !(b, c)) { r = 1 } else { r = 2 }',
      code: 'if (!(a || (b, c))) { r = 1 } else { r = 2 }',
      situation: 'a grouped sequence operand',
      values: [false, true, false],
    },
    {
      output: 'if (!a && !(b = c)) { r = 1 } else { r = 2 }',
      code: 'if (!(a || (b = c))) { r = 1 } else { r = 2 }',
      situation: 'a grouped assignment operand',
      values: [false, true, false],
    },
    {
      situation: 'a group after nullish coalescing',
      output: 'r = c ?? (!a && !b)',
      values: [false, false, null],
      code: 'r = c ?? !(a || b)',
    },
    {
      situation: 'a group compared with strict equality',
      output: 'r = (!a && !b) === c',
      values: [true, false, false],
      code: 'r = !(a || b) === c',
    },
    {
      situation: 'a group added to a number',
      output: 'r = 1 + (!a && !b)',
      code: 'r = 1 + !(a || b)',
      values: [false, true],
    },
    {
      situation: 'a group with a negation after &&',
      output: 'r = c && !b && !!a',
      code: 'r = c && !(b || !a)',
      values: [5, 0, 1],
    },
    {
      situation: 'a group with a negation in a comparison',
      output: 'r = c === (!b && !!a)',
      code: 'r = c === !(b || !a)',
      values: [5, 0, true],
    },
  ])(
    'should rewrite $situation and keep its result',
    async ({ output, values, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedDisjunction'],
        code,
      })

      expect(result.output).toBe(output)
      expect(evaluateFixture(result.output, values)).toBe(
        evaluateFixture(code, values),
      )
    },
  )

  describe('with enforceForMixedOperators', () => {
    let options = [{ enforceForMixedOperators: true }]

    it.each([
      {
        output: 'if (!(a && b) && !c) {}',
        code: 'if (!(a && b || c)) {}',
        group: 'a leading conjunction',
      },
      {
        output: 'if (!a && !(b && c)) {}',
        group: 'a trailing conjunction',
        code: 'if (!(a || b && c)) {}',
      },
      {
        output: 'if (!(a && b) && !(c && d) && !e) {}',
        code: 'if (!(a && b || c && d || e)) {}',
        group: 'several conjunctions',
      },
      {
        group: 'a conjunction in a value context',
        output: 'const x = !(a && b) && !c',
        code: 'const x = !(a && b || c)',
      },
      {
        group: 'a conjunction that holds a negation',
        output: 'if (!(!a && b) && !c) {}',
        code: 'if (!(!a && b || c)) {}',
      },
      {
        output: 'const x = !(a && b) && !(/* keep */ c)',
        group: 'a grouped operand with a comment inside',
        code: 'const x = !(a && b || (/* keep */ c))',
      },
      {
        output: 'if (!(a && b) && // important condition\n    !c) {}',
        code: 'if (!(a && b || // important condition\n    c)) {}',
        group: 'a line comment after the operator',
      },
      {
        group: 'a space after the negation',
        output: 'if (!(a && b) && !c) {}',
        code: 'if (! (a && b || c)) {}',
      },
      {
        output: 'r = d ?? (!(a && b) && !c)',
        group: 'a parent nullish coalescing',
        code: 'r = d ?? !(a && b || c)',
      },
    ])(
      'should rewrite a negated disjunction with $group',
      async ({ output, code }) => {
        let { result } = await invalid({
          errors: ['convertNegatedDisjunction'],
          options,
          code,
        })

        expect(result.output).toBe(output)
      },
    )

    // Pinned current behavior that the docs do not describe yet.
    it('should not report a value whose mixed group already holds a negation', async () => {
      await valid({ code: 'const x = !(!a && b || c)', options })
    })

    it('should show the original and the fixed mixed group in the message', async () => {
      let { result } = await invalid({
        errors: ['convertNegatedDisjunction'],
        code: 'if (!(a && b || c)) {}',
        options,
      })

      expect(result.messages[0]).toHaveProperty(
        'message',
        'Replace negated disjunction `!(a && b || c)` with `!(a && b) && !c`',
      )
    })

    it.each([
      { situation: 'both conjunction operands are truthy', values: [1, 1, 0] },
      { situation: 'one conjunction operand is falsy', values: [1, 0, 0] },
      { situation: 'the last operand is null', values: [0, 'x', null] },
      { situation: 'an operand is NaN', values: [Number.NaN, 1, ''] },
    ])(
      'should rewrite a mixed group and keep its result when $situation',
      async ({ values }) => {
        let code = 'r = !(a && b || c)'

        let { result } = await invalid({
          errors: ['convertNegatedDisjunction'],
          options,
          code,
        })

        expect(result.output).toBe('r = !(a && b) && !c')
        expect(evaluateFixture(result.output, values)).toBe(
          evaluateFixture(code, values),
        )
      },
    )

    it('should fully expand mixed operators with no-negated-conjunction', async () => {
      let { invalid: invalidWithConjunction } = createRuleTester({
        configs: [
          testerConfig.configs,
          {
            plugins: {
              'de-morgan': {
                rules: { 'no-negated-conjunction': conjunctionRule },
              },
            },
            rules: { 'de-morgan/no-negated-conjunction': 'error' },
          },
        ],
        name: 'no-negated-disjunction',
        // The second rule only applies to the result of the first fix.
        recursive: 10,
        rule,
      })

      let { result } = await invalidWithConjunction({
        errors: ['convertNegatedDisjunction'],
        code: '!(1 && 1 || 1)',
        options,
      })

      expect(result.output).toBe('(!1 || !1) && !1')
    })
  })

  it.each([
    {
      options: { enforceForMixedOperators: 'yes' },
      option: 'a value that is not boolean',
      problem: 'should be boolean',
    },
    {
      problem: 'should NOT have additional properties',
      options: { unknownOption: true },
      option: 'an unknown option',
    },
  ])('should reject $option', async ({ problem, options }) => {
    await expect(valid({ options: [options], code: 'x' })).rejects.toThrow(
      problem,
    )
  })

  it('should link to its documentation', () => {
    expect(rule.meta.docs.url).toBe(
      'https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/docs/no-negated-disjunction.md',
    )
  })
})
