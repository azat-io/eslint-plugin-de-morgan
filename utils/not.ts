/**
 * Negates the result of the given predicate function.
 *
 * @param predicate - A function that takes any number of arguments and returns
 *   a boolean.
 * @returns A function that negates the boolean result of the predicate.
 */
export function not<T extends unknown[]>(
  predicate: (...arguments_: T) => boolean,
) {
  return (...arguments_: T): boolean => !predicate(...arguments_)
}
