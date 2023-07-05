import { defineConfig } from 'tsup'

export default defineConfig({
    format: ['esm', 'cjs'],
    dts: {
        resolve: true,
    },
    entry: ['src/index.ts', 'src/browser', 'src/server'],
    splitting: true,
    sourcemap: true,
    clean: true,
})
