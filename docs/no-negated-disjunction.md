# no-negated-disjunction

Transforms the negation of a disjunction into the equivalent conjunction of
negations according to De Morgan’s second law.

## Rule Details

This rule enforces that when a disjunction is negated, the expression is
rewritten according to De Morgan’s law. Instead of writing a negated disjunction
like:

```js
if (!(a || b)) {
  /* ... */
}
```

The rule suggests (and can auto-fix) the equivalent form:

```js
if (!a && !b) {
  /* ... */
}
```

## Why Use This Rule?

Negated disjunctions can sometimes be less clear or counterintuitive.
Transforming them into a conjunction of negations makes the logic explicit:

- It clearly indicates that both conditions must be false.
- It may help avoid mistakes in complex boolean logic by making the individual
  conditions more explicit.

## When Is the Rule Applied?

- The rule applies only when the operand of the negation is a pure disjunction —
  that is, when all operands are combined with || at the same nesting level.
- If the expression inside the negation contains a mix of logical operators (for
  example, `!(a || b && c))`, the rule will not apply the transformation.

## Auto-fix

This rule is auto-fixable. When applied, it automatically rewrites code such as:

```js
const foo = !(a || !b || c >= 10)
```

To:

```js
const foo = !a && b && c < 10
```

## Options

This rule has no options.

## Related Rules

- [no-negated-conjunction](https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/docs/no-negated-conjunction.md)
  — A similar rule for transforming the negation of a conjunction `(!(A && B))`
  into the equivalent disjunction of negations `(!A || !B)`, based on De
  Morgan’s first law.

## Resources

- [Rule Source](https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/rules/no-negated-disjunction.ts)
- [Test Source](https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/test/rules/no-negated-disjunction.test.ts)
