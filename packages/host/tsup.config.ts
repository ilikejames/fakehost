import { defineConfig } from 'tsup'

export default defineConfig({
    format: ['esm', 'cjs'],
    dts: true,
    entry: ['src/index.ts', 'src/browser.ts'],
    splitting: true,
    sourcemap: true,
    clean: true,
})
