import type { Rule } from 'eslint'

/**
 * Builds a rule context around the given fake source code. A unit test only
 * needs the few `sourceCode` members that the tested utility reads, so the fake
 * keeps the shape the test gives it and is widened to the context type here.
 *
 * @example
 *
 * ```ts
 * let context = createFakeContext({ getText: node => node.raw })
 * ```
 *
 * @param sourceCode - The fake source code the tested utility reads from.
 * @returns A rule context exposing the given source code.
 */
export function createFakeContext(sourceCode: object): Rule.RuleContext {
  return { sourceCode } as Rule.RuleContext
}
