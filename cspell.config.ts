import { defineConfig } from 'cspell'

export default defineConfig({
  ignorePaths: [
    '.github',
    'changelog.md',
    'license',
    'pnpm-lock.yaml',
    'tsconfig.json',
  ],
  words: [
    'azat',
    'changelogen',
    'changelogithub',
    'crosspost',
    'humanwhocodes',
  ],
  dictionaries: ['css', 'html', 'node', 'npm', 'typescript'],
  useGitignore: true,
  language: 'en',
})
