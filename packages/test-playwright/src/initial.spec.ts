import { expect, test } from '@playwright/test'
import { createFakes, initPage } from './config'
import { log } from './helper'

test.describe('initial test setup', () => {
    let testEnv: Awaited<ReturnType<typeof createFakes>>

    test.beforeEach(async () => {
        testEnv = await createFakes()
    })

    test.afterEach(async ({ page }) => {
        await page.close()
        await testEnv.dispose()
    })

    test('should display REST result', async ({ page, context }) => {
        await initPage({ page, context }, testEnv)
        await page.goto('/')
        await expect(page.locator('[aria-label="username"]')).toHaveText('test-user')
        log.data('username', await page.textContent('[aria-label="username"]'))
    })

    test('should display SignalR result', async ({ page, context }) => {
        await initPage({ page, context }, testEnv)
        await page.goto('/')
        await expect(page.locator('time')).toHaveText(/^\d{1,2}:\d{1,2}:\d{1,2}((AM|PM)?)/)
        log.data('time', await page.textContent('time'))
    })
})
