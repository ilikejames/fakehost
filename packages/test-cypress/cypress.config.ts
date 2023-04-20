import { defineConfig } from 'cypress'

export default defineConfig({
    video: false,
    viewportWidth: 2000,
    viewportHeight: 1800,
    numTestsKeptInMemory: 10,

    e2e: {
        excludeSpecPattern: '*.js',
        supportFile: 'src/support/index.ts',
        specPattern: '**/*.spec.ts',
    },
})
