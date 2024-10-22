import { OrderStatus } from '@fakehost/signalr-test-client-api'
import { orderState } from '@fakehost/signalr-test-fake-svc'
import { Locator, expect, test } from '@playwright/test'
import Chalk from 'chalk'
import { createFakes, initPage } from './config'
import { log, waitUntil } from './helper'

test.describe('order grid', () => {
    let testEnv: Awaited<ReturnType<typeof createFakes>>

    test.beforeEach(async ({ page, context }) => {
        testEnv = await createFakes()
        await initPage({ page, context }, testEnv)
        await page.goto('/')
        const locator = page.locator('table')
        await waitForTableRows(locator)
    })

    test.afterEach(async ({ page }) => {
        await page.close()
        await testEnv.dispose()
    })

    test('should display orders', async ({ page }) => {
        const rows = await orderTable(page.locator('table'), 5)
        expect(rows.length).toBe(5)
        rows.forEach(row => {
            log.data(row)
            expect(row.status).toBe('Open')
            expect(row.percentFilled).toBe(0)
        })
    })

    test('orders are updated in the grid', async ({ page }) => {
        log.when('Before:')
        const locator = page.locator('table')
        const [beforeRow] = await orderTable(locator, 1)
        log.data(beforeRow)
        expect(beforeRow).toMatchObject({
            status: 'Open',
            percentFilled: 0,
            filledQuantity: 0,
        })

        log.when('Updating top row...')
        const updated = orderState.update({
            orderId: beforeRow.orderId,
            status: OrderStatus.Partial,
            filledQuantity: Math.floor(beforeRow.totalQuantity / 2),
        })

        log.then('It is updated in the table')
        await waitUntil(async () => (await orderTable(locator, 1))[0].status !== 'Open')
        const [afterRow] = await orderTable(locator, 1)
        log.data(afterRow)
        expect(afterRow).toMatchObject({
            status: 'Partially Filled',
            percentFilled: 50,
            filledQuantity: updated?.filledQuantity,
        })
    })

    test('new orders arrive', async ({ page }) => {
        log.when('Before:')
        const locator = page.locator('table')
        const before = await orderTable(locator, 3)
        before.forEach(row => log.data(row))

        const created = orderState.create()
        log.when('A new order is created. orderId =', created.orderId)
        await waitUntil(async () => (await orderTable(locator, 1))[0].orderId === created.orderId)
        const after = await orderTable(locator, 3)
        after.forEach(row =>
            log.data(row.orderId === created.orderId ? Chalk.inverse(JSON.stringify(row)) : row),
        )
    })

    test('orders are removed', async ({ page }) => {
        log.when('Before:')
        const locator = page.locator('table')
        await waitForTableRows(locator, 3)
        const before = await orderTable(locator, 3)
        before.forEach(row => log.data(row))

        log.when(`An order is deleted. orderId = ${before[1].orderId}`)
        orderState.delete(before[1].orderId)
        await waitUntil(async () => {
            const rows = await orderTable(locator, 3)
            const orderIds = rows.map(row => row.orderId)
            return !orderIds.includes(before[1].orderId)
        })

        log.then('After:')
        const after = await orderTable(locator, 3)
        after.forEach(row => log.data(row))
        expect(after.map(row => row.orderId)).not.toContain(before[1].orderId)
    })
})

const waitForTableRows = async (root: Locator, rowCount = 1) =>
    waitUntil(async () => {
        const parsed = await parseTable(root, rowCount)
        return parsed.length === rowCount
    })

type OrderRow = {
    orderId: number
    status: string
    symbol: string
    price: number
    totalQuantity: number
    filledQuantity: number
    percentFilled: number
}

const orderTable = async (root: Locator, max = Number.MAX_SAFE_INTEGER) => {
    const table = await parseTable(root, max)
    return table.map(
        row =>
            ({
                orderId: parseInt(`${row['orderId']}`),
                status: row['status'] as string,
                symbol: row['symbol'] as string,
                price: parseInt(`${row['price']}`),
                totalQuantity: parseInt(`${row['totalQuantity']}`),
                filledQuantity: parseInt(`${row['filledQuantity']}`),
                percentFilled: parseInt(`${row['Percent Filled']}`),
            } as OrderRow),
    )
}

const parseTable = async (root: Locator, max = Number.MAX_SAFE_INTEGER) => {
    const headers = await root.locator('th').all()
    const headingContent = await Promise.all(
        headers.map(heading => {
            return Promise.all([heading.getAttribute('data-colid'), heading.textContent()])
        }),
    )
    const headingMap = headingContent.reduce((acc, [id, text], i) => {
        acc.set(i, id ?? `${i}`)
        return acc
    }, new Map<number, string>())

    const rows = await root.locator('tbody').getByRole('row').all()
    const matchingRows = rows.slice(0, max)
    const rowContent = await Promise.all(matchingRows.map(row => parseRow(row, headingMap)))
    const result = rowContent.map(row => {
        return row.reduce((acc, cell, index) => {
            const header = headingMap.get(index)!
            acc[header] = cell ?? ''
            return acc
        }, {} as Record<string, string>)
    })
    return result
}

const parseRow = async (row: Locator, header: Map<number, string>) => {
    const cells = await row.locator('td').all()
    const cellContent = await Promise.all(
        cells.map((cell, i) => {
            switch (header.get(i)!) {
                case 'Percent Filled':
                    return cell.getByRole('progressbar').getAttribute('aria-valuenow')
                default:
                    return cell.textContent()
            }
        }),
    )
    return cellContent
}
