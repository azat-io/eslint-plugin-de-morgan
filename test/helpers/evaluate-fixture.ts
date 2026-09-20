/**
 * Evaluates the given code fixture in an isolated function whose parameters are
 * the `a`, `b`, `c` and `d` identifiers used by the rule fixtures, and returns
 * the value that the fixture assigned to the `r` variable. Comparing the result
 * of the original fixture with the result of the fixed one proves that an
 * autofix preserves runtime semantics.
 *
 * @example
 *
 * ```ts
 * evaluateFixture('if (!a || !b) { r = 1 } else { r = 2 }', [true, false]) // 1
 * ```
 *
 * @param source - The code fixture to evaluate.
 * @param values - The values bound to the `a`, `b`, `c` and `d` parameters.
 * @returns The value of the `r` variable after the fixture was evaluated.
 */
export function evaluateFixture(source: string, values: unknown[]): unknown {
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
