/**
 * Creates a function that takes multiple predicates and applies them to the
 * given parameters. If any predicate returns `false`, the function immediately
 * returns `false`. Otherwise, it returns `true` if all predicates return
 * `true`.
 *
 * @example
 *   let test = createTestWithParameters(3, 4)
 *   let result = test(
 *     (x, y) => x + y > 0,
 *     (x, y) => x * y < 100,
 *   )
 *   console.log(result) // true
 *
 * @template Arguments - The types of parameters that will be tested.
 * @param {...Arguments} parameters - The parameters to be tested by the
 *   predicates.
 * @returns {(predicates: ((...args: Arguments) => boolean)[]) => boolean} A
 *   function that takes multiple predicates and returns `true` if all
 *   predicates return `true`, otherwise `false`.
 */
export function createTestWithParameters<Arguments extends unknown[]>(
  ...parameters: Arguments
) {
  return (
    ...predicates: ((...arguments_: Arguments) => boolean)[]
  ): boolean => {
    for (let predicate of predicates) {
      if (!predicate(...parameters)) {
        return false
      }
    }
    return true
  }
}
