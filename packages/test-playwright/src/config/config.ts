import type { PlaywrightTestConfig } from '@playwright/test'
import { devices } from '@playwright/test'
import { resolve } from 'path'

const PORT = 4000

export const config: PlaywrightTestConfig = {
    testDir: '../',
    testMatch: /.*(spec).(ts)/g,
    /* Maximum time one test can run for. */
    timeout: parseInt(process.env.TEST_TIMEOUT || `${15 * 1000}`),
    expect: {
        /**
         * Maximum time expect() should wait for the condition to be met.
         * For example in `await expect(locator).toHaveText();`
         */
        timeout: 5000,
    },
    /* Run tests in files in parallel */
    fullyParallel: false,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    // workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'line',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
        actionTimeout: 0,
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: process.env.BASE_URL || `http://localhost:${PORT}`,

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                launchOptions: {
                    args:
                        process.env.OPEN_DEVTOOLS === 'true'
                            ? ['--auto-open-devtools-for-tabs']
                            : [],
                },
            },
        },
        // {
        //     name: 'firefox',
        //     use: {
        //         ...devices['Desktop Firefox'],
        //     },
        // },
        // {
        //     name: 'webkit',
        //     use: {
        //         ...devices['Desktop Safari'],
        //     },
        // },
    ],

    /* Folder for test artifacts such as screenshots, videos, traces, etc. */
    outputDir: '../../test-results/',

    // /* Run your local dev server before starting the tests */
    webServer: {
        command: `yarn --cwd ../../../test-web-app start --port ${PORT}`,
        port: PORT,
        reuseExistingServer: true,
    },
}

export default config
