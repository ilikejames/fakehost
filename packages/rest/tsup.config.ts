import { defineConfig } from 'tsup'

export default defineConfig({
    format: ['esm', 'cjs'],
    dts: true,
    entry: ['src/index.ts', 'src/HijackedRestService.ts', 'src/HttpRestService.ts'],
    splitting: false,
    sourcemap: true,
    clean: true,
})
