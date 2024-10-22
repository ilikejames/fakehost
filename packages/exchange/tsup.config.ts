import { defineConfig } from 'tsup'

export default defineConfig({
    format: ['esm', 'cjs'],
    dts: 'src/index.ts',
    entry: ['src/index.ts', 'src/browser', 'src/server'],
    splitting: false,
    clean: true,
})
