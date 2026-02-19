/**
 * Combines multiple predicate functions using logical OR (`||`). The returned
 * function returns `true` as soon as one predicate returns `true`. Otherwise,
 * it returns `false`.
 *
 * @example
 *
 * ```ts
 * let isEven = (x: number) => x % 2 === 0
 * let isNegative = (x: number) => x < 0
 *
 * let isEvenOrNegative = or(isEven, isNegative)
 * console.log(isEvenOrNegative(2)) // true
 * console.log(isEvenOrNegative(-3)) // true
 * console.log(isEvenOrNegative(3)) // false
 * ```
 *
 * @param predicates - The predicates to combine.
 * @returns A function that returns `true` if any predicate returns `true`,
 *   otherwise `false`.
 */
export function or<Arguments extends unknown[]>(
  ...predicates: ((...arguments_: Arguments) => boolean)[]
) {
  return (...arguments_: Arguments): boolean =>
    predicates.some(predicate => predicate(...arguments_))
}
