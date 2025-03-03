/**
 * Applies a predicate function to a specified property of an object. This
 * function extracts the given property from an object and applies the provided
 * predicate to it, returning the result.
 *
 * @example
 *   let isPositive = (x: number) => x > 0
 *   let testValue = applyToProperty('value', isPositive)
 *
 *   console.log(testValue({ value: 10 })) // true
 *   console.log(testValue({ value: -5 })) // false
 *
 * @template T - The type of the object.
 * @template K - The key of the property in the object.
 * @param {K} property - The property name to extract from the object.
 * @param {(value: T[K]) => boolean} predicate - The predicate function to apply
 *   to the property's value.
 * @returns {(obj: T) => boolean} A function that takes an object of type T and
 *   applies the predicate to its specified property.
 */
export let applyToProperty =
  <T extends Record<K, V>, K extends string, V = T[K]>(
    property: K,
    predicate: (value: V) => boolean,
  ): ((object: T) => boolean) =>
  (object: T): boolean =>
    predicate(object[property])
