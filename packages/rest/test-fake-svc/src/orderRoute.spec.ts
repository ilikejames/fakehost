import { NewOrder, NewOrderSideEnum, OrderControllerApi } from '@fakehost/rest-generated-client-api'
import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { router } from './router'
import { TestEnv, testSetup, getTestTarget } from './testSetup'

describe(`${getTestTarget()}: orderRoute`, () => {
    let env: TestEnv
    let api: OrderControllerApi

    beforeAll(async () => {
        env = await testSetup(getTestTarget(), router)
        api = new OrderControllerApi(env.config)
    })

    afterAll(() => {
        env.dispose()
    })

    const newOrder: NewOrder = {
        quantity: 10,
        side: NewOrderSideEnum.Buy,
        symbol: 'AAPL',
    }

    describe('POST application/json', () => {
        test('success', async () => {
            const order = await api.placeOrderJson({ newOrder })
            expect(order).toMatchObject({
                id: expect.any(Number),
                ...newOrder,
            })
        })

        test('UNKNOWN symbol', async () => {
            expect.assertions(2)
            try {
                await api.placeOrderJson({ newOrder: { ...newOrder, symbol: 'UNKNOWN' } })
            } catch (ex: any) {
                const response = ex.response as Response
                expect(response.status).toBe(400)
                expect(await response.json()).toEqual({ message: 'Unknown symbol: UNKNOWN' })
            }
        })

        test('invalid quantity', async () => {
            expect.assertions(2)
            try {
                await api.placeOrderJson({ newOrder: { ...newOrder, quantity: 0 } })
            } catch (ex: any) {
                const response = ex.response as Response
                expect(response.status).toBe(400)
                expect(await response.json()).toEqual({
                    message: 'Quantity should be greater than zero',
                })
            }
        })
    })

    describe('POST multipart/form-data', () => {
        test('success', async () => {
            const order = await api.placeOrderForm(newOrder)
            expect(order).toMatchObject({
                id: expect.any(Number),
                ...newOrder,
            })
        })

        test('UNKNOWN symbol', async () => {
            expect.assertions(3)
            try {
                await api.placeOrderForm({ ...newOrder, symbol: 'UNKNOWN' })
            } catch (ex: any) {
                const response = ex.response as Response
                expect(response.ok).toBe(false)
                expect(response.status).toBe(400)
                expect(await response.json()).toEqual({ message: 'Unknown symbol: UNKNOWN' })
            }
        })

        test('invalid quantity', async () => {
            expect.assertions(3)
            try {
                await api.placeOrderForm({ ...newOrder, quantity: 0 })
            } catch (ex: any) {
                const response = ex.response as Response
                expect(response.ok).toBe(false)
                expect(response.status).toBe(400)
                expect(await response.json()).toEqual({
                    message: 'Quantity should be greater than zero',
                })
            }
        })
    })

    describe('POST application/x-www-form-urlencoded', () => {
        test('success', async () => {
            const form = new FormData()
            Object.entries(newOrder).forEach(([key, value]) => form.append(key, value))
            // TODO: There doesn't appear to be away to generate a typescript openApi that
            // takes formData. 🤔
            const result = await fetch(`${env.url}/orders/form-data`, {
                method: 'POST',
                body: form,
            })

            expect(await result.json()).toMatchObject({
                id: expect.any(Number),
                ...newOrder,
            })
        })

        test('UNKNOWN symbols', async () => {
            expect.assertions(3)
            const form = new FormData()
            Object.entries(newOrder).forEach(([key, value]) => form.append(key, value))
            form.set('symbol', 'UNKNOWN')

            const result = await fetch(`${env.url}/orders/form-data`, {
                method: 'POST',
                body: form,
            })
            expect(result.ok).toBe(false)
            expect(result.status).toBe(400)
            expect(await result.json()).toEqual({ message: 'Unknown symbol: UNKNOWN' })
        })

        test('invalid quantity', async () => {
            expect.assertions(3)
            const form = new FormData()
            Object.entries(newOrder).forEach(([key, value]) => form.append(key, value))
            form.set('quantity', '0')

            const result = await fetch(`${env.url}/orders/form-data`, {
                method: 'POST',
                body: form,
            })
            expect(result.ok).toBe(false)
            expect(result.status).toBe(400)
            expect(await result.json()).toEqual({ message: 'Quantity should be greater than zero' })
        })
    })
})
