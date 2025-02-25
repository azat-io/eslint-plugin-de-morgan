import { describe, it } from 'vitest'
import { RuleTester } from 'eslint'
import dedent from 'dedent'

import rule from '../../rules/no-negated-disjunction'

RuleTester.describe = describe
RuleTester.itOnly = it.only
RuleTester.it = it

let ruleTester = new RuleTester()

ruleTester.run('noNegatedDisjunction', rule, {
  invalid: [
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a && !b) {}',
      code: 'if (!(a || b)) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || !b)',
            fixed: '!a && b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      code: 'if (!(a || !b)) {}',
      output: 'if (!a && b) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(!a || b)',
            fixed: 'a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      code: 'if (!(!a || b)) {}',
      output: 'if (a && !b) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'const x = !a && !b',
      code: 'const x = !(a || b)',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'let x = !a && !b',
      code: 'let x = !(a || b)',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'var x = !a && !b',
      code: 'var x = !(a || b)',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'const f = () => !a && !b',
      code: 'const f = () => !(a || b)',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b !== c)',
            fixed: '!a && b === c',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a && b === c) {}',
      code: 'if (!(a || b !== c)) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'const y = (!a && !b)',
      code: 'const y = (!(a || b))',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'while (!a && !b) { doSomething(); }',
      code: 'while (!(a || b)) { doSomething(); }',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'for (; !a && !b; ) { doSomething(); }',
      code: 'for (; !(a || b); ) { doSomething(); }',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'const result = !a && !b ? 1 : 0;',
      code: 'const result = !(a || b) ? 1 : 0;',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || (b || c))',
            fixed: '!a && !b && !c',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a && !b && !c) {}',
      code: 'if (!(a || (b || c))) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'do { doSomething(); } while (!a && !b);',
      code: 'do { doSomething(); } while (!(a || b));',
    },
    {
      errors: [
        {
          data: {
            original: '!( a || b )',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      code: 'while (!( a || b )) { doSomething(); }',
      output: 'while (!a && !b) { doSomething(); }',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b || c)',
            fixed: '!a && !b && !c',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a && !b && !c) {}',
      code: 'if (!(a || b || c)) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || !b || c || !d)',
            fixed: '!a && b && !c && d',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      code: 'if (!(a || !b || c || !d)) {}',
      output: 'if (!a && b && !c && d) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || (b && c))',
            fixed: '!a && !(b && c)',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a && !(b && c)) {}',
      code: 'if (!(a || (b && c))) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b || (c && d))',
            fixed: '!a && !b && !(c && d)',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a && !b && !(c && d)) {}',
      code: 'if (!(a || b || (c && d))) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || (b && c) || d)',
            fixed: '!a && !(b && c) && !d',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a && !(b && c) && !d) {}',
      code: 'if (!(a || (b && c) || d)) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b || c || (d && e))',
            fixed: '!a && !b && !c && !(d && e)',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a && !b && !c && !(d && e)) {}',
      code: 'if (!(a || b || c || (d && e))) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || (b || c) || d)',
            fixed: '!a && !b && !c && !d',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a && !b && !c && !d) {}',
      code: 'if (!(a || (b || c) || d)) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || (b && (c || d)))',
            fixed: '!a && !(b && (c || d))',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a && !(b && (c || d))) {}',
      code: 'if (!(a || (b && (c || d)))) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || (b || (c && d)))',
            fixed: '!a && !b && !(c && d)',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a && !b && !(c && d)) {}',
      code: 'if (!(a || (b || (c && d)))) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b || (c || d))',
            fixed: '!a && !b && !c && !d',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a && !b && !c && !d) {}',
      code: 'if (!(a || b || (c || d))) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || (b && c) || (d && e))',
            fixed: '!a && !(b && c) && !(d && e)',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a && !(b && c) && !(d && e)) {}',
      code: 'if (!(a || (b && c) || (d && e))) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a && !b && c) {}',
      code: 'if (!(a || b) && c) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(b || !c)',
            fixed: '!b && c',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      code: 'if (a && !(b || !c)) {}',
      output: 'if (a && !b && c) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a && !b && (!c && !d)) {}',
      code: 'if (!(a || b) && (!c && !d)) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'const arr = [...(!a && !b ? [1] : [2])]',
      code: 'const arr = [...(!(a || b) ? [1] : [2])]',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      /* eslint-disable no-template-curly-in-string */
      output: 'const str = `${!a && !b}`',
      code: 'const str = `${!(a || b)}`',
      /* eslint-enable no-template-curly-in-string */
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'const { prop = !a && !b } = obj',
      code: 'const { prop = !(a || b) } = obj',
    },
    {
      errors: [
        {
          data: {
            original: '!(a > b || c < d)',
            fixed: 'a <= b && c >= d',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (a <= b && c >= d) {}',
      code: 'if (!(a > b || c < d)) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(foo() || bar())',
            fixed: '!foo() && !bar()',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!foo() && !bar()) {}',
      code: 'if (!(foo() || bar())) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(obj.prop || obj.method())',
            fixed: '!obj.prop && !obj.method()',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!obj.prop && !obj.method()) {}',
      code: 'if (!(obj.prop || obj.method())) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a || b)',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'function foo() { return !a && !b }',
      code: 'function foo() { return !(a || b) }',
    },
    {
      errors: [
        {
          data: {
            original: '!(obj.method().prop || obj?.optionalMethod?.())',
            fixed: '!obj.method().prop && !obj?.optionalMethod?.()',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!obj.method().prop && !obj?.optionalMethod?.()) {}',
      code: 'if (!(obj.method().prop || obj?.optionalMethod?.())) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!(a?.b || c?.d)',
            fixed: '!a?.b && !c?.d',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!a?.b && !c?.d) {}',
      code: 'if (!(a?.b || c?.d)) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!((a ?? b) || (c ?? d))',
            fixed: '!(a ?? b) && !(c ?? d)',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!(a ?? b) && !(c ?? d)) {}',
      code: 'if (!((a ?? b) || (c ?? d))) {}',
    },
    {
      errors: [
        {
          data: {
            original: "!('a' in x || 'b' in x)",
            fixed: "!('a' in x) && !('b' in x)",
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: "if (!('a' in x) && !('b' in x)) {}",
      code: "if (!('a' in x || 'b' in x)) {}",
    },
    {
      errors: [
        {
          data: {
            original: '!(a instanceof A || b instanceof B)',
            fixed: '!(a instanceof A) && !(b instanceof B)',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      output: 'if (!(a instanceof A) && !(b instanceof B)) {}',
      code: 'if (!(a instanceof A || b instanceof B)) {}',
    },
    {
      errors: [
        {
          data: {
            original: '!( a || b )',
            fixed: '!a && !b',
          },
          messageId: 'convertNegatedDisjunction',
        },
      ],
      code: dedent`
        if (!(
          a ||
          b
        )) {}
      `,
      output: dedent`
        if (!a &&
          !b) {}
      `,
    },
  ],
  valid: [
    'if (!a) {}',
    'if (a || b) {}',
    'if (a && b) {}',
    'if (~(a || b)) {}',
    'if (!(a && b)) {}',
    'if (a || b || c) {}',
    'const x = a || b',
    'const x = a && b',
    'const x = !(a && b)',
    'let x = a || b',
    'let x = a && b',
    'let x = !(a && b)',
    'var x = a || b',
    'var x = a && b',
    'var x = !(a && b)',
    'foo(!a && !b)',
    'const f = () => a && b',
    'if (!(a || b && c)) {}',
    'if (!(a && b || c)) {}',
    'if (!((a || b) && c)) {}',
    'if (!!(a || b)) {}',
    'foo(!(a || !b))',
  ],
})
