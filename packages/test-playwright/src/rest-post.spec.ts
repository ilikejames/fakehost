import { NewOrder, OrderSideEnum } from '@fakehost/rest-generated-client-api'
import { orderRoute } from '@fakehost/rest-test-fake-svc'
import { Page, expect, test } from '@playwright/test'
import { createFakes, initPage } from './config'
import { log } from './helper'

const contentTypes = [
    'application/x-www-form-urlencoded',
    'application/json',
    'multipart/form-data',
] as const

type ContentType = (typeof contentTypes)[number]

test.describe('rest / post', () => {
    let testEnv: Awaited<ReturnType<typeof createFakes>>

    test.beforeEach(async ({ page, context }) => {
        testEnv = await createFakes()
        await initPage({ page, context }, testEnv)
        await page.goto('/')
    })

    test.afterEach(async ({ page }) => {
        await page.close()
        await testEnv.dispose()
    })

    const validOrder: Required<NewOrder> = {
        symbol: 'AAPL',
        quantity: 100,
        side: OrderSideEnum.Sell,
    }

    for (const contentType of contentTypes) {
        test(`success: send "${contentType}"`, async ({ page }) => {
            await openForm(page)
            await sendForm(page, validOrder, contentType)

            const { icon, response } = await getResult(page)
            expect(icon).toBe('SuccessOutlinedIcon')
            expect(JSON.parse(response!)).toMatchObject({
                id: expect.any(Number),
                ...validOrder,
            })
        })

        test(`error: "unknown symbol" with "${contentType}" payload`, async ({ page }) => {
            await openForm(page)

            const order = { ...validOrder, symbol: 'UNKNOWN' }
            await sendForm(page, order, contentType)

            const { icon, response } = await getResult(page)
            expect(icon).toBe('ErrorOutlineIcon')
            expect(response).toBe('Unknown symbol: UNKNOWN')
        })

        test(`error: "invalid quantity" with "${contentType}" payload`, async ({ page }) => {
            await openForm(page)

            const order: Required<NewOrder> = { ...validOrder, quantity: 0 }
            await sendForm(page, order, contentType)

            const { icon, response } = await getResult(page)
            expect(icon).toBe('ErrorOutlineIcon')
            expect(response).toBe('Quantity should be greater than zero')
        })

        test(`error: unexpected error with "${contentType}" payload`, async ({ page }) => {
            // The real remote can occasionally fail due to upstream issues.
            log.when('Service is configured to throw "Unexpected error occurred"')
            orderRoute.controls.shouldThrowUnexpected = true
            try {
                await openForm(page)
                await sendForm(page, validOrder, contentType)
                const { icon, response } = await getResult(page)
                expect(icon).toBe('ErrorOutlineIcon')
                expect(response).toBe('Unexpected error occurred')
            } finally {
                orderRoute.controls.shouldThrowUnexpected = false
            }
        })
    }
})

const openForm = async (page: Page) => {
    await page.locator('button', { hasText: 'POST Data' }).click()
    await page.waitForSelector('h2:has-text("Test POST Data")')
}

const sendForm = async (page: Page, order: Required<NewOrder>, contentType: ContentType) => {
    await page.fill('input[name="symbol"]', order.symbol)
    await page.fill('input[name="quantity"]', order.quantity.toString())
    await page.check(`input[name="side"][value="${order.side}"]`)
    await page.check(`input[name="content-type"][value="${contentTypes[0]}"]`)
    await page.locator('button', { hasText: 'Send' }).click()
}

const getResult = async (page: Page) => {
    const iconSelector = '.MuiAlert-icon > svg'
    await page.waitForSelector(iconSelector)
    const icon = await page.getAttribute(iconSelector, 'data-testid')
    const response = await page.textContent('.MuiAlert-message')
    log.data('Icon =', icon)
    log.data('Response =', response)

    return {
        icon,
        response,
    }
}
