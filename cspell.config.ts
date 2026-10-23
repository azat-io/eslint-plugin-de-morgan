import { defineConfig } from 'cspell'

export default defineConfig({
  words: [
    'azat',
    'changelogen',
    'changelogithub',
    'crosspost',
    'humanwhocodes',
    'oxlint',
    'oxlintrc',
  ],
  ignorePaths: [
    '.github',
    'changelog.md',
    'license',
    'pnpm-lock.yaml',
    'tsconfig.json',
  ],
  dictionaries: ['css', 'html', 'node', 'npm', 'typescript'],
  useGitignore: true,
  language: 'en',
})
