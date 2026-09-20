/**
 * The shared rule tester configuration used by the tests of every rule. It pins
 * the parser options so that the tested source is always parsed as a modern ES
 * module.
 */
export let testerConfig = {
  configs: {
    languageOptions: {
      parserOptions: {
        sourceType: 'module' as const,
        ecmaVersion: 2022 as const,
      },
    },
  },
}
