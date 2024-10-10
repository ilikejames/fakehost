import { defineConfig } from 'tsup'

export default defineConfig({
    format: ['esm', 'cjs'],
    dts: {
        resolve: true,
    },
    entry: ['src/index.ts'],
    splitting: false,
    clean: true,
})
