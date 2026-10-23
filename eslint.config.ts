import type { Linter } from 'eslint'

import eslintPlugin from 'eslint-plugin-eslint-plugin'
import eslintConfig from '@azat-io/eslint-config'

export default eslintConfig({
  extends: [
    eslintPlugin.configs.recommended,
    {
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                message:
                  'Only type imports are allowed: Oxlint loads the plugin without ESLint.',
                allowTypeImports: true,
                name: 'eslint',
              },
            ],
          },
        ],
      },
      files: ['index.ts', 'rules/**/*.ts', 'utils/**/*.ts'],
    },
  ],
  perfectionist: true,
  typescript: true,
  vitest: true,
  node: true,
}) satisfies Promise<Linter.Config[]>
