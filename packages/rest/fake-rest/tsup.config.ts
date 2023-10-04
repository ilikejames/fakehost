import { defineConfig } from 'tsup'

export default defineConfig({
    format: ['esm', 'cjs'],
    dts: {
        resolve: true,
    },
    entry: {
        index: 'src/index.ts',
        server: 'src/HttpRestService.ts',
        browser: 'src/HijackedRestService.ts',
    },
    splitting: true,
    sourcemap: true,
    clean: true,
})
