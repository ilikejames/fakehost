import { defineConfig } from 'tsup'

export default defineConfig({
    format: ['esm', 'cjs'],
    dts: {
        resolve: true,
    },
    entry: ['src/index.ts', 'src/HijackedRestService.ts', 'src/HttpRestService.ts'],
    splitting: true,
    sourcemap: true,
    clean: true,
})
