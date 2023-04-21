import { defineConfig } from 'cypress'
import printer from 'cypress-terminal-report/src/installLogsPrinter'

export default defineConfig({
    video: false,
    viewportWidth: 2000,
    viewportHeight: 1800,
    numTestsKeptInMemory: 10,

    e2e: {
        excludeSpecPattern: '*.js',
        supportFile: 'src/support/index.ts',
        specPattern: '**/*.spec.ts',
        setupNodeEvents(on, config) {
            printer(on, {
                outputVerbose: true,
                printLogsToConsole: 'always',
            })
            on('before:browser:launch', (browser, launchOptions) => {
                if (browser.name === 'chrome' && browser.isHeadless) {
                    launchOptions.args.push('--window-size=2000,1800')
                    return launchOptions
                }
            })
        },
    },
})
