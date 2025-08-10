import type { Linter } from 'eslint'

import eslintPlugin from 'eslint-plugin-eslint-plugin'
import eslintConfig from '@azat-io/eslint-config'

export default eslintConfig({
  extends: eslintPlugin.configs.recommended,
  perfectionist: true,
  typescript: true,
  vitest: true,
  node: true,
}) satisfies Promise<Linter.Config[]>
