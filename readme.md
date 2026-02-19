# ESLint Plugin De Morgan

<img
  src="https://raw.githubusercontent.com/azat-io/eslint-plugin-de-morgan/main/assets/logo.svg"
  alt="ESLint Plugin De Morgan logo"
  align="right"
  height="160"
  width="160"
/>

[![Version](https://img.shields.io/npm/v/eslint-plugin-de-morgan.svg?color=4a32c3&labelColor=26272b)](https://npmjs.com/package/eslint-plugin-de-morgan)
[![Monthly Download](https://img.shields.io/npm/dm/eslint-plugin-de-morgan.svg?color=4a32c3&labelColor=26272b)](https://npmjs.com/package/eslint-plugin-de-morgan)
[![Code Coverage](https://img.shields.io/codecov/c/github/azat-io/eslint-plugin-de-morgan.svg?color=4a32c3&labelColor=26272b)](https://npmjs.com/package/eslint-plugin-de-morgan)
[![GitHub License](https://img.shields.io/badge/license-MIT-232428.svg?color=4a32c3&labelColor=26272b)](https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/license.md)

An ESLint plugin that enforces logical consistency by transforming negated
boolean expressions according to De Morgan’s laws.

This plugin automatically rewrites negated conjunctions and disjunctions to
improve code clarity and reduce potential logical errors.

## Why

In Boolean algebra, De Morgan’s laws are two transformation rules that are both
valid rules of inference. They are named after Augustus De Morgan and are
fundamental in the fields of mathematics, computer science, and digital logic.
The laws state that:

**First Law:**

_¬(A ∧ B) ≡ (¬A) ∨ (¬B)_

**Second Law:**

_¬(A ∨ B) ≡ (¬A) ∧ (¬B)_

Using these principles, the plugin provides two ESLint rules:

- [no-negated-conjunction](https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/docs/no-negated-conjunction.md)
  — Transforms negated conjunctions (i.e. expressions of the form !(A && B))
  into the equivalent disjunction of negations (!A || !B).
- [no-negated-disjunction](https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/docs/no-negated-disjunction.md)
  — Transforms negated disjunctions (i.e. expressions of the form !(A || B))
  into the equivalent conjunction of negations (!A && !B).

These transformations are grounded in Boolean algebra and can help make the
logic of your code more explicit and easier to understand.

### Why Use De Morgan’s Laws?

De Morgan’s laws are a cornerstone of Boolean algebra and have several practical
benefits in programming:

- **Clarity**: Rewriting complex negations often results in expressions that
  more clearly communicate the underlying logic.

- **Avoiding Logical Errors**: When dealing with nested logical expressions,
  small mistakes in the placement of negations can lead to subtle bugs. By
  enforcing a consistent style based on well-known laws, the plugin helps reduce
  such errors.

- **Simplification**: In some cases, the transformed expression may be simpler
  to evaluate and optimize, both for human readers and for compilers /
  interpreters.

### Examples

**Base example**

Before:

```js
if (!(a && b)) {
  /* ... */
}
```

After:

```js
if (!a || !b) {
  /* ... */
}
```

**More complex example**

Before:

```js
if (!(a || !b || c >= 10 || d !== e)) {
  /* ... */
}
```

After:

```js
if (!a && b && c < 10 && d === e) {
  /* ... */
}
```

## Installation

You'll first need to install [ESLint](https://eslint.org):

```sh
npm install --save-dev eslint
```

Next, install `eslint-plugin-de-morgan`:

```sh
npm install --save-dev eslint-plugin-de-morgan
```

## Usage

The easiest way to use `eslint-plugin-de-morgan` is to use ready-made config.

### Flat Config ([`eslint.config.js`](https://eslint.org/docs/latest/use/configure/configuration-files))

<!-- prettier-ignore -->
```js
import deMorgan from 'eslint-plugin-de-morgan'

export default [
  deMorgan.configs.recommended,
]
```

### Legacy Config ([`.eslintrc.js`](https://eslint.org/docs/latest/use/configure/configuration-files-deprecated))

<!-- prettier-ignore -->
```js
module.exports = {
  extends: [
    'plugin:de-morgan/recommended-legacy',
  ],
}
```

## Rules

🔧 Automatically fixable by the
[`--fix` CLI option](https://eslint.org/docs/latest/use/command-line-interface#--fix).

| Name                                                                                                                  | Description                                                              | 🔧  |
| :-------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- | :-- |
| [no-negated-conjunction](https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/docs/no-negated-conjunction.md) | Transforms the negation of a conjunction into the equivalent disjunction | 🔧  |
| [no-negated-disjunction](https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/docs/no-negated-disjunction.md) | Transforms the negation of a disjunction into the equivalent conjunction | 🔧  |

## Further Reading

- [De Morgan’s Laws](https://en.wikipedia.org/wiki/De_Morgan%27s_laws)
- [Boolean Algebra](https://en.wikipedia.org/wiki/Boolean_algebra)

## Versioning Policy

This plugin is following [Semantic Versioning](https://semver.org/) and
[ESLint's Semantic Versioning Policy](https://github.com/eslint/eslint#semantic-versioning-policy).

## Contributing

See
[Contributing Guide](https://github.com/azat-io/eslint-plugin-de-morgan/blob/main/contributing.md).

## License

MIT &copy; [Azat S.](https://azat.io)
