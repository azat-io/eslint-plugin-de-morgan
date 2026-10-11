import { createRuleTester } from 'eslint-vitest-rule-tester'
import { describe, expect, it } from 'vitest'
import dedent from 'dedent'

import { evaluateFixture } from '../helpers/evaluate-fixture'
import { testerConfig } from '../helpers/tester-config'
import rule from '../../rules/no-negated-conjunction'

/**
 * Runs a fixture that declares the generator `g(a)`, resumes it once with
 * `false` as the value of its `yield`, and returns the value of `r`.
 *
 * @param source - The code fixture to run.
 * @returns The value of the `r` variable after the generator was resumed.
 */
function runGenerator(source: string): unknown {
  // eslint-disable-next-line typescript/no-implied-eval, no-new-func
  let execute = new Function(
    `let r; ${source}; let iterator = g(true); iterator.next(); iterator.next(false); return r`,
  ) as () => unknown
  return execute()
}

describe('no-negated-conjunction', () => {
  let { invalid, valid } = createRuleTester({
    ...testerConfig,
    name: 'no-negated-conjunction',
    rule,
  })

  it.each([
    { situation: 'a negated identifier', code: 'if (!a) {}' },
    { situation: 'a bitwise NOT of a conjunction', code: 'if (~(a && b)) {}' },
    { situation: 'a negated disjunction', code: 'if (!(a || b)) {}' },
    {
      situation: 'a disjunction led by a conjunction',
      code: 'if (!(a && b || c)) {}',
    },
    {
      situation: 'a disjunction ending in a conjunction',
      code: 'if (!(a || b && c)) {}',
    },
    {
      situation: 'a disjunction of a grouped conjunction',
      code: 'if (!((a && b) || c)) {}',
    },
    // Pinned current behavior that the docs do not describe yet: outside a
    // Boolean context, a group that already holds a negation is left alone.
    { situation: 'a value group holding a negation', code: 'foo(!(a && !b))' },
  ])('should not report $situation', async ({ code }) => {
    await valid(code)
  })

  it.each([
    {
      output: 'if (!a || !b) {}',
      context: 'an if condition',
      code: 'if (!(a && b)) {}',
    },
    {
      context: 'a const declaration',
      output: 'const x = !a || !b',
      code: 'const x = !(a && b)',
    },
    {
      context: 'a let declaration',
      output: 'let x = !a || !b',
      code: 'let x = !(a && b)',
    },
    {
      context: 'a var declaration',
      output: 'var x = !a || !b',
      code: 'var x = !(a && b)',
    },
    {
      output: 'const f = () => !a || !b',
      code: 'const f = () => !(a && b)',
      context: 'an arrow function body',
    },
    {
      context: 'a parenthesized initializer',
      output: 'const y = (!a || !b)',
      code: 'const y = (!(a && b))',
    },
    {
      output: 'while (!a || !b) { doSomething(); }',
      code: 'while (!(a && b)) { doSomething(); }',
      context: 'a while condition',
    },
    {
      output: 'for (; !a || !b; ) { doSomething(); }',
      code: 'for (; !(a && b); ) { doSomething(); }',
      context: 'a for condition',
    },
    {
      output: 'do { doSomething(); } while (!a || !b);',
      code: 'do { doSomething(); } while (!(a && b));',
      context: 'a do-while condition',
    },
    {
      output: 'const result = !a || !b ? 1 : 0;',
      code: 'const result = !(a && b) ? 1 : 0;',
      context: 'a conditional test',
    },
    {
      output: 'const arr = [...(!a || !b ? [1] : [2])]',
      code: 'const arr = [...(!(a && b) ? [1] : [2])]',
      context: 'a conditional test inside a spread',
    },
    {
      // eslint-disable-next-line no-template-curly-in-string
      output: 'const str = `${!a || !b}`',
      // eslint-disable-next-line no-template-curly-in-string
      code: 'const str = `${!(a && b)}`',
      context: 'a template literal',
    },
    {
      output: 'const { prop = !a || !b } = obj',
      code: 'const { prop = !(a && b) } = obj',
      context: 'a destructuring default',
    },
  ])(
    'should rewrite a negated conjunction in $context',
    async ({ output, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedConjunction'],
        code,
      })

      expect(result.output).toBe(output)
    },
  )

  it.each([
    {
      operands: 'a negated last operand',
      code: 'if (!(a && !b)) {}',
      output: 'if (!a || b) {}',
    },
    {
      operands: 'a negated first operand',
      code: 'if (!(!a && b)) {}',
      output: 'if (a || !b) {}',
    },
    {
      output: 'if (!a || b === c) {}',
      code: 'if (!(a && b !== c)) {}',
      operands: 'an inequality',
    },
    {
      output: 'if (!a || !b || !c) {}',
      code: 'if (!(a && b && c)) {}',
      operands: 'three operands',
    },
    {
      operands: 'a grouped conjunction',
      output: 'if (!a || !b || !c) {}',
      code: 'if (!(a && (b && c))) {}',
    },
    {
      operands: 'a grouped disjunction',
      output: 'if (!a || !(b || c)) {}',
      code: 'if (!(a && (b || c))) {}',
    },
    {
      output: 'if (!foo() || !bar()) {}',
      code: 'if (!(foo() && bar())) {}',
      operands: 'function calls',
    },
    {
      output: 'if (!obj.prop || !obj.method()) {}',
      code: 'if (!(obj.prop && obj.method())) {}',
      operands: 'a property and a method call',
    },
    {
      output: 'if (!a?.b || !c?.d) {}',
      code: 'if (!(a?.b && c?.d)) {}',
      operands: 'optional chains',
    },
    {
      output: 'if (!(a ?? b) || !(c ?? d)) {}',
      code: 'if (!((a ?? b) && (c ?? d))) {}',
      operands: 'grouped nullish coalescing',
    },
    {
      output: 'if (!(a instanceof A) || !(b instanceof B)) {}',
      code: 'if (!(a instanceof A && b instanceof B)) {}',
      operands: 'instanceof checks',
    },
    {
      output: 'if (!(a > b) || !(c < d)) {}',
      operands: 'relational comparisons',
      code: 'if (!(a > b && c < d)) {}',
    },
    {
      operands: 'a comparison with a grouped assignment',
      output: 'if (!(a < (x = y)) || !d) {}',
      code: 'if (!(a < (x = y) && d)) {}',
    },
    {
      operands: 'a comparison with a comment inside',
      output: 'if (!(a /* keep */ < b) || !c) {}',
      code: 'if (!(a /* keep */ < b && c)) {}',
    },
    {
      operands: 'an equality with a grouped disjunction',
      output: 'if ((a || b) !== c || !d) {}',
      code: 'if (!((a || b) === c && d)) {}',
    },
    {
      operands: 'an equality with a grouped bitmask',
      output: 'if ((flags & 4) !== 0 || !x) {}',
      code: 'if (!((flags & 4) === 0 && x)) {}',
    },
    {
      operands: 'an equality with a grouped assignment',
      output: 'if ((a = b) !== c || !d) {}',
      code: 'if (!((a = b) === c && d)) {}',
    },
    {
      operands: 'an equality with grouped nullish',
      code: '!((a ?? b) === c && d)',
      output: '(a ?? b) !== c || !d',
    },
    {
      operands: 'an equality with a comment inside',
      output: 'if (a /* keep */ !== b || !c) {}',
      code: 'if (!(a /* keep */ === b && c)) {}',
    },
    {
      output: 'if (!a || !(b ? c : d)) {}',
      code: 'if (!(a && (b ? c : d))) {}',
      operands: 'a grouped conditional',
    },
    {
      output: 'if (!a || !(b, c)) {}',
      operands: 'a grouped sequence',
      code: 'if (!(a && (b, c))) {}',
    },
    {
      operands: 'a grouped sequence led by a negation',
      output: 'if (!a || !(!b, c)) {}',
      code: 'if (!(a && (!b, c))) {}',
    },
    {
      operands: 'a grouped assignment',
      output: 'if (!a || !(b = c)) {}',
      code: 'if (!(a && (b = c))) {}',
    },
    {
      operands: 'a grouped logical assignment',
      output: 'if (!a || !(b &&= c)) {}',
      code: 'if (!(a && (b &&= c))) {}',
    },
    {
      operands: 'a grouped arrow function',
      output: 'if (!a || !(x => x)) {}',
      code: 'if (!(a && (x => x))) {}',
    },
    {
      output: 'function* g(a) { if (!a || !(yield)) {} }',
      code: 'function* g(a) { if (!(a && (yield))) {} }',
      operands: 'a grouped yield',
    },
  ])(
    'should rewrite a negated conjunction with $operands',
    async ({ output, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedConjunction'],
        code,
      })

      expect(result.output).toBe(output)
    },
  )

  it.each([
    {
      output: "if (!a || b !== '||') {}",
      code: "if (!(a && b === '||')) {}",
      place: 'a string',
    },
    {
      output: 'if (!a || /* || */ !b) {}',
      code: 'if (!(a && /* || */ b)) {}',
      place: 'a comment',
    },
    {
      place: 'a comment that repeats the group',
      output: 'if (!a || /* a && b */ !b) {}',
      code: 'if (!(a && /* a && b */ b)) {}',
    },
    {
      output: 'if (!a || !b[c || d]) {}',
      code: 'if (!(a && b[c || d])) {}',
      place: 'a computed member key',
    },
    {
      // eslint-disable-next-line no-template-curly-in-string
      output: 'if (!a || !`${c || d}`) {}',
      // eslint-disable-next-line no-template-curly-in-string
      code: 'if (!(a && `${c || d}`)) {}',
      place: 'a template literal',
    },
    {
      output: 'if (!a || !/x||y/u.test(b)) {}',
      code: 'if (!(a && /x||y/u.test(b))) {}',
      place: 'a regular expression',
    },
  ])(
    'should leave logical operators inside $place unchanged',
    async ({ output, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedConjunction'],
        code,
      })

      expect(result.output).toBe(output)
    },
  )

  it.each([
    {
      layout: 'extra spaces around the operator',
      output: 'if (!a  ||  !b) {}',
      code: 'if (!(a  &&  b)) {}',
    },
    {
      layout: 'a line break after the operator',
      output: 'if (!a ||\n    !b) {}',
      code: 'if (!(a &&\n    b)) {}',
    },
    {
      code: dedent`
        function func() {
          return !(
            a === b &&
            (c ||
              d(e, f))
          )
        }
      `,
      output: dedent`
        function func() {
          return a !== b ||
            !(c ||
              d(e, f))
        }
      `,
      layout: 'a nested multiline operand',
    },
    {
      code: dedent`
        function f(a, b, c, d) {
          return !(
            (a || b) &&
            (c || d)
          )
        }
      `,
      output: dedent`
        function f(a, b, c, d) {
          return !(a || b) ||
            !(c || d)
        }
      `,
      layout: 'multiline grouped disjunctions',
    },
  ])('should keep $layout', async ({ output, code }) => {
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code,
    })

    expect(result.output).toBe(output)
  })

  it.each([
    {
      output: 'if (!a || // important condition\n    !b) {}',
      code: 'if (!(a && // important condition\n    b)) {}',
      position: 'after the operator',
    },
    {
      output: 'if (!a || /* this is why we need b */ !b) {}',
      code: 'if (!(a && /* this is why we need b */ b)) {}',
      position: 'before the second operand',
    },
    {
      position: 'inside a grouped right operand',
      output: 'const x = !a || !(/* keep */ b)',
      code: 'const x = !(a && (/* keep */ b))',
    },
    {
      output: 'const x = !(a /* keep */) || !b',
      position: 'inside a grouped left operand',
      code: 'const x = !((a /* keep */) && b)',
    },
    {
      position: 'on its own line inside a grouped operand',
      output: 'const x = !a || !(// keep\n  b)',
      code: 'const x = !(a && (// keep\n  b))',
    },
    {
      position: 'with an apostrophe after the operator',
      output: "if (!a || // don't\n  b !== 'x') {}",
      code: "if (!(a && // don't\n  b === 'x')) {}",
    },
    {
      position: 'after the opening parenthesis',
      output: 'if (/* note */ !a || !b) {}',
      code: 'if (!(/* note */ a && b)) {}',
    },
    {
      code: dedent`
        if (
          !(
            // why
            a &&
            b
          )
        ) {}
      `,
      output: dedent`
        if (
          // why
            !a ||
            !b
        ) {}
      `,
      position: 'on its own line before the operands',
    },
    {
      position: 'when the fix is wrapped in parentheses',
      output: 'r = c && (!a || !b // why\n)',
      code: 'r = c && !(a && b // why\n)',
    },
    {
      position: 'before an indented closing parenthesis',
      output: 'r = c && (!a || !b // why\n  )',
      code: 'r = c && !(a && b // why\n  )',
    },
  ])('should keep a comment $position', async ({ output, code }) => {
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code,
    })

    expect(result.output).toBe(output)
  })

  it.each([
    {
      output: 'const f = () => ({}.x !== a || !b)',
      code: 'const f = () => !({}.x === a && b)',
      position: 'the body of an arrow function',
      start: 'an object literal',
    },
    {
      output: 'const f = () => ({}.x !== a || !b) || c',
      position: 'the start of an arrow function body',
      code: 'const f = () => !({}.x === a && b) || c',
      start: 'an object literal',
    },
    {
      output: 'const f = () => (/* note */ {}.x !== a || !b)',
      code: 'const f = () => !(/* note */ {}.x === a && b)',
      start: 'an object literal after a comment',
      position: 'the body of an arrow function',
    },
    {
      output: 'export default (function () {} !== b || !c)',
      code: 'export default !(function () {} === b && c)',
      position: 'a default export',
      start: 'a function',
    },
    {
      output: 'export default (class {} !== b || !c)',
      code: 'export default !(class {} === b && c)',
      position: 'a default export',
      start: 'a class',
    },
    {
      output: 'export default (async function () {} !== b || !c)',
      code: 'export default !(async function () {} === b && c)',
      position: 'a default export',
      start: 'an async function',
    },
    {
      output: 'export default (function () {} !== b || !c) || d',
      code: 'export default !(function () {} === b && c) || d',
      position: 'the start of a default export',
      start: 'a function',
    },
    {
      output: '(async function () {} !== b || !c)',
      code: '!(async function () {} === b && c)',
      position: 'the start of a statement',
      start: 'an async function',
    },
    {
      output: '(async /* note */ function () {} !== b || !c)',
      code: '!(async /* note */ function () {} === b && c)',
      start: 'an async function with a comment inside',
      position: 'the start of a statement',
    },
    {
      output: '(async /* first */ /** second */ function () {} !== b || !c)',
      code: '!(async /* first */ /** second */ function () {} === b && c)',
      start: 'an async function with two comments',
      position: 'the start of a statement',
    },
    {
      output: '(async /* a **b * c **/ function () {} !== b || !c)',
      code: '!(async /* a **b * c **/ function () {} === b && c)',
      start: 'an async function and a starred comment',
      position: 'the start of a statement',
    },
    {
      position: 'the start of a statement',
      output: '({}.x !== a || !b)',
      code: '!({}.x === a && b)',
      start: 'an object literal',
    },
    {
      position: 'the start of a statement',
      output: '(class {} !== b || !c)',
      code: '!(class {} === b && c)',
      start: 'a class',
    },
    {
      output: 'export default (/* note */ function () {} !== b || !c)',
      code: 'export default !(/* note */ function () {} === b && c)',
      start: 'a function after a comment',
      position: 'a default export',
    },
  ])(
    'should parenthesize a fix that starts with $start at $position',
    async ({ output, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedConjunction'],
        code,
      })

      expect(result.output).toBe(output)
    },
  )

  it.each([
    {
      output: 'const f = () => ({}.x !== a || !b // why\n)\nconst g = 1',
      code: 'const f = () => !({}.x === a && b // why\n)\nconst g = 1',
      position: 'the body of an arrow function',
    },
    {
      output:
        'export default (function () {} !== b || !c // why\n)\nconst g = 1',
      code: 'export default !(function () {} === b && c // why\n)\nconst g = 1',
      position: 'a default export',
    },
  ])(
    'should keep a trailing line comment away from the parenthesis added at $position',
    async ({ output, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedConjunction'],
        code,
      })

      expect(result.output).toBe(output)
    },
  )

  it('should keep a single pair of parentheses at a parenthesized arrow function body', async () => {
    let { result } = await invalid({
      code: 'const f = () => (!({}.x === a && b))',
      errors: ['convertNegatedConjunction'],
    })

    expect(result.output).toBe('const f = () => ({}.x !== a || !b)')
  })

  it.each([
    {
      output: 'const f = () => function () {} !== b || !c',
      code: 'const f = () => !(function () {} === b && c)',
      position: 'the body of an arrow function',
      start: 'a function',
    },
    {
      output: 'const f = () => class {} !== b || !c',
      code: 'const f = () => !(class {} === b && c)',
      position: 'the body of an arrow function',
      start: 'a class',
    },
    {
      start: 'an identifier like asyncfunction',
      position: 'the start of a statement',
      output: 'asyncfunction !== a || !b',
      code: '!(asyncfunction === a && b)',
    },
    {
      start: 'an identifier that begins with class',
      position: 'the start of a statement',
      output: 'classes !== a || !b',
      code: '!(classes === a && b)',
    },
    {
      start: 'an identifier that begins with function',
      position: 'the start of a statement',
      output: 'functionName !== a || !b',
      code: '!(functionName === a && b)',
    },
    {
      output: 'export default {} !== a || !b',
      code: 'export default !({} === a && b)',
      position: 'a default export',
      start: 'an object literal',
    },
    {
      position: 'the start of a statement',
      start: 'an async identifier',
      output: 'async !== a || !b',
      code: '!(async === a && b)',
    },
    {
      start: 'a negation, then an object literal',
      position: 'the start of a statement',
      output: '!a || b !== {}',
      code: '!(a && b === {})',
    },
    {
      position: 'the start of a statement',
      start: 'a negation, then a class',
      output: '!a || b !== class {}',
      code: '!(a && b === class {})',
    },
    {
      start: 'a negation, then a function',
      output: '!a || b !== function () {}',
      code: '!(a && b === function () {})',
      position: 'the start of a statement',
    },
  ])(
    'should not parenthesize a fix that starts with $start at $position',
    async ({ output, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedConjunction'],
        code,
      })

      expect(result.output).toBe(output)
    },
  )

  it.each([
    {
      output: '(let[0] !== a || !b)',
      code: '!(let[0] === a && b)',
      start: 'let and a bracket',
    },
    {
      start: 'let, a block comment and a bracket',
      output: '(let /* note */ [0] !== a || !b)',
      code: '!(let /* note */ [0] === a && b)',
    },
    {
      output: '(let /** note */ [0] !== a || !b)',
      start: 'let, a JSDoc comment and a bracket',
      code: '!(let /** note */ [0] === a && b)',
    },
    {
      output: '(let /* a **b * c **/ [0] !== a || !b)',
      code: '!(let /* a **b * c **/ [0] === a && b)',
      start: 'let, a starred comment and a bracket',
    },
    {
      start: 'let, a line break and a bracket',
      output: '(let\n[0] !== a || !b)',
      code: '!(let\n[0] === a && b)',
    },
    {
      start: 'let, a line comment and a bracket',
      output: '(let // note\n[0] !== a || !b)',
      code: '!(let // note\n[0] === a && b)',
    },
  ])(
    'should parenthesize a statement in a script whose fix starts with $start',
    async ({ output, code }) => {
      let { result } = await invalid({
        languageOptions: { sourceType: 'script' },
        errors: ['convertNegatedConjunction'],
        code,
      })

      expect(result.output).toBe(output)
    },
  )

  it.each([
    {
      output: 'let !== a || !b',
      code: '!(let === a && b)',
      start: 'a let identifier',
    },
    {
      start: 'a negation, then let and a bracket',
      output: '!a || b !== let[0]',
      code: '!(a && b === let[0])',
    },
  ])(
    'should not parenthesize a statement in a script whose fix starts with $start',
    async ({ output, code }) => {
      let { result } = await invalid({
        languageOptions: { sourceType: 'script' },
        errors: ['convertNegatedConjunction'],
        code,
      })

      expect(result.output).toBe(output)
    },
  )

  it.each([
    { code: 'r = a.default\n!(-b === 1 && c)', access: 'a.default' },
    { code: 'r = a?.default\n!((b).z === 1 && c)', access: 'a?.default' },
  ])(
    'should withhold the fix of a statement after $access when the fix could merge with it',
    async ({ code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedConjunction'],
        code,
      })

      expect(result.output).toBe(code)
    },
  )

  it('should withhold the fix of a statement whose parenthesized fix could merge with the previous line', async () => {
    let code = 'r = c\n!(a && b) && d'

    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code,
    })

    expect(result.output).toBe(code)
  })

  it.each([
    {
      output: 'x = 1; (function () {} !== b || !c)',
      code: 'x = 1; !(function () {} === b && c)',
      token: 'a semicolon',
    },
    {
      output: '{ (function () {} !== b || !c) }',
      code: '{ !(function () {} === b && c) }',
      token: 'an opening brace',
    },
    {
      output: 'r = 1; (function(){} !== b || !c); r = 2',
      code: 'r = 1; !(function(){} === b && c); r = 2',
      token: 'a semicolon between assignments',
    },
  ])(
    'should parenthesize a fix that starts a statement after $token',
    async ({ output, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedConjunction'],
        code,
      })

      expect(result.output).toBe(output)
    },
  )

  it('should not withhold the fix of a statement that only has a parenthesis after its start', async () => {
    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code: 'r = c\n!(a && f(b))',
    })

    expect(result.output).toBe('r = c\n!a || !f(b)')
  })

  it.each([
    {
      message: 'Replace negated conjunction `!(a && b)` with `!a || !b`',
      operands: 'two plain operands',
      code: 'if (!(a && b)) {}',
    },
    {
      message: 'Replace negated conjunction `!(a && !b)` with `!a || b`',
      operands: 'a negated last operand',
      code: 'if (!(a && !b)) {}',
    },
    {
      message: 'Replace negated conjunction `!(!a && b)` with `a || !b`',
      operands: 'a negated first operand',
      code: 'if (!(!a && b)) {}',
    },
    {
      message:
        'Replace negated conjunction `!(a && b !== c)` with `!a || b === c`',
      code: 'if (!(a && b !== c)) {}',
      operands: 'an inequality',
    },
    {
      message:
        'Replace negated conjunction `!(a && (b && c))` with `!a || !b || !c`',
      operands: 'a grouped conjunction',
      code: 'if (!(a && (b && c))) {}',
    },
    {
      message:
        'Replace negated conjunction `!(a && (b || c))` with `!a || !(b || c)`',
      operands: 'a grouped disjunction',
      code: 'if (!(a && (b || c))) {}',
    },
    {
      message:
        'Replace negated conjunction `!(a > b && c < d)` with `!(a > b) || !(c < d)`',
      operands: 'relational comparisons',
      code: 'if (!(a > b && c < d)) {}',
    },
    {
      message:
        "Replace negated conjunction `!(a && b === 'x')` with `!a || b !== 'x'`",
      code: "if (!(a && // don't\n  b === 'x')) {}",
      operands: 'an apostrophe in a line comment',
    },
  ])(
    'should show the original and the fixed conjunction with $operands in the message',
    async ({ message, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedConjunction'],
        code,
      })

      expect(result.messages[0]).toHaveProperty('message', message)
    },
  )

  it.each([
    {
      output: 'if (!(a < b) || !c) { r = 1 } else { r = 2 }',
      code: 'if (!(a < b && c)) { r = 1 } else { r = 2 }',
      situation: 'a relational comparison with NaN',
      values: [Number.NaN, 1, true],
    },
    {
      output: 'if (!(a < b) || !c) { r = 1 } else { r = 2 }',
      code: 'if (!(a < b && c)) { r = 1 } else { r = 2 }',
      situation: 'a relational comparison with undefined',
      values: [undefined, 1, true],
    },
    {
      output: 'if (!a || !(b ? c : d)) { r = 1 } else { r = 2 }',
      code: 'if (!(a && (b ? c : d))) { r = 1 } else { r = 2 }',
      situation: 'a grouped conditional operand',
      values: [false, true, 0, 1],
    },
    {
      output: 'if (!a || !(b, c)) { r = 1 } else { r = 2 }',
      code: 'if (!(a && (b, c))) { r = 1 } else { r = 2 }',
      situation: 'a grouped sequence operand',
      values: [true, true, false],
    },
    {
      output: 'if (!a || !(b = c)) { r = 1 } else { r = 2 }',
      code: 'if (!(a && (b = c))) { r = 1 } else { r = 2 }',
      situation: 'a grouped assignment operand',
      values: [true, true, false],
    },
    {
      output: 'if (!a || !(x => x)) { r = 1 } else { r = 2 }',
      code: 'if (!(a && (x => x))) { r = 1 } else { r = 2 }',
      situation: 'a grouped arrow function operand',
      values: [true],
    },
    {
      output: 'if (!a || !(!b, c)) { r = 1 } else { r = 2 }',
      code: 'if (!(a && (!b, c))) { r = 1 } else { r = 2 }',
      situation: 'a grouped sequence led by a negation',
      values: [true, false, false],
    },
    {
      situation: 'a group after nullish coalescing',
      output: 'r = c ?? (!a || !b)',
      values: [true, true, null],
      code: 'r = c ?? !(a && b)',
    },
    {
      situation: 'a group compared with strict equality',
      output: 'r = (!a || !b) === c',
      values: [false, false, false],
      code: 'r = !(a && b) === c',
    },
    {
      situation: 'a group used as the key of an in check',
      output: 'r = (!a || !b) in c',
      values: [false, false, {}],
      code: 'r = !(a && b) in c',
    },
    {
      situation: 'a group under a unary minus',
      output: 'r = -(!a || !b)',
      code: 'r = -!(a && b)',
      values: [true, true],
    },
    {
      situation: 'a group added to a number',
      output: 'r = 1 + (!a || !b)',
      code: 'r = 1 + !(a && b)',
      values: [true, false],
    },
    {
      situation: 'a group under void',
      output: 'r = void (!a || !b)',
      code: 'r = void !(a && b)',
      values: [true, false],
    },
    {
      situation: 'a group converted to an index',
      values: [true, true, ['first', 'second']],
      output: 'r = c[+(!a || !b)]',
      code: 'r = c[+!(a && b)]',
    },
    {
      output: 'for (var i = (a != b in c || !d); i; i = false) { r = 1 }',
      code: 'for (var i = !(a == b in c && d); i; i = false) { r = 1 }',
      situation: 'a loop initializer with an in check',
      values: [true, 'k', {}, true],
    },
    {
      situation: 'a group with a negation after &&',
      output: 'r = c && (!!a || !b)',
      code: 'r = c && !(!a && b)',
      values: [5, 0, 1],
    },
    {
      situation: 'a group with a negation in a branch',
      output: 'r = c ? !!a || !b : 0',
      code: 'r = c ? !(!a && b) : 0',
      values: [5, 0, 1],
    },
    {
      situation: 'a group with a negation in a comparison',
      output: 'r = c === (!!a || !b)',
      code: 'r = c === !(!a && b)',
      values: [5, 0, true],
    },
    {
      situation: 'a group with a negation under typeof',
      output: 'r = typeof (!!a || !b)',
      code: 'r = typeof !(!a && b)',
      values: [5, 0],
    },
    {
      situation: 'a group with a negation as an in key',
      output: 'r = (!!a || !b) in c',
      code: 'r = !(!a && b) in c',
      values: [5, 0, { 5: 1 }],
    },
  ])(
    'should rewrite $situation and keep its result',
    async ({ output, values, code }) => {
      let { result } = await invalid({
        errors: ['convertNegatedConjunction'],
        code,
      })

      expect(result.output).toBe(output)
      expect(evaluateFixture(result.output, values)).toBe(
        evaluateFixture(code, values),
      )
    },
  )

  it('should rewrite a grouped yield operand and keep its result', async () => {
    let code =
      'function* g(a) { if (!(a && (yield))) { r = 1 } else { r = 2 } }'

    let { result } = await invalid({
      errors: ['convertNegatedConjunction'],
      code,
    })

    expect(result.output).toBe(
      'function* g(a) { if (!a || !(yield)) { r = 1 } else { r = 2 } }',
    )
    expect(runGenerator(result.output)).toBe(runGenerator(code))
  })
})
