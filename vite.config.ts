import { prettierFormat } from 'vite-plugin-prettier-format'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import path from 'node:path'

export default defineConfig({
  build: {
    lib: {
      entry: [path.resolve(import.meta.dirname, 'index.ts')],
      fileName: (_format, entryName) => `${entryName}.js`,
      name: 'eslint-plugin-de-morgan',
      formats: ['es'],
    },
    rollupOptions: {
      external: (id: string) => !id.startsWith('.') && !path.isAbsolute(id),
      output: {
        preserveModules: true,
      },
    },
    minify: false,
  },
  plugins: [
    dts({
      include: [
        path.join(import.meta.dirname, 'index.ts'),
        path.join(import.meta.dirname, 'rules'),
        path.join(import.meta.dirname, 'utils'),
      ],
      insertTypesEntry: true,
      strictOutput: true,
      copyDtsFiles: true,
    }),
    prettierFormat(),
  ],
})
