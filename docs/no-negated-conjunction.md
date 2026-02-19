# no-negated-conjunction

Transforms the negation of a conjunction into the equivalent disjunction of
negations according to De Morgan’s first law.

## Rule Details

This rule enforces that when a conjunction is negated, the expression is
rewritten according to De Morgan’s law. Instead of writing a negated conjunction
like:

```js
if (!(a && b)) {
  /* ... */
}
```

The rule suggests (and can auto-fix) the equivalent form:

```js
if (!a || !b) {
  /* ... */
}
```

## Why Use This Rule?

Negated conjunctions can sometimes be harder to read and understand.
Transforming them into a disjunction of negations makes the logic explicit:

- It clearly shows that at least one of the conditions must be false.
- It may help avoid mistakes in complex boolean logic.

## When Is the Rule Applied?

- The rule applies **only** when the operand of the negation is a pure
  conjunction — that is, when all operands are combined with && at the same
  nesting level.
- If the expression inside the negation contains a mix of logical operators (for
  example, `!(a && b || c))`, the rule will not apply the transformation.

## Auto-fix

This rule is auto-fixable. When applied, it automatically rewrites code such as:

```js
const foo = !(a && !b && c >= 10)
```

To:

```js
const foo = !a || b || c < 10
```

## Options

This rule has no options.

## Related Rules

- [no-negated-disjunction](https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/docs/no-negated-disjunction.md)
  — A similar rule for transforming the negation of a disjunction `(!(A || B))`
  into the equivalent conjunction of negations `(!A && !B)`, based on De
  Morgan’s second law.

## Resources

- [Rule Source](https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/rules/no-negated-conjunction.ts)
- [Test Source](https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/test/rules/no-negated-conjunction.test.ts)
