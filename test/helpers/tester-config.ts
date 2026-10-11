/**
 * The shared rule tester configuration used by the tests of every rule. It pins
 * the parser options so that the tested source is always parsed as a modern ES
 * module. Fixes are applied once, the way a user gets them from a single fix in
 * an editor, and the tester then checks that nothing is left to report. With
 * the tester's default of ten passes, a fix that needs several passes would
 * look complete.
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
  recursive: false as const,
}
