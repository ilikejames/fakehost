import { describe, test, expect, vi } from 'vitest'
import { createRouter } from './createRouter'

describe('createRouter', () => {
    test('simple get', () => {
        const router = createRouter()
        const cb1 = vi.fn()
        const cb2 = vi.fn()
        const cb3 = vi.fn()
        router.get('/api/endpoint', cb1)
        router.get('/api/endpoint/:id', cb2)
        router.get('/somewhere', cb3)

        expect(router.routes[0]).toMatchObject({
            path: '/api/endpoint',
            handler: cb1,
        })
        expect(router.routes[1]).toMatchObject({
            path: '/api/endpoint/:id',
            handler: cb2,
        })
        expect(router.routes[2]).toMatchObject({
            path: '/somewhere',
            handler: cb3,
        })
    })

    test('with use(Handler)', () => {
        const router = createRouter()
        const cb1 = vi.fn()
        const cb2 = vi.fn()
        const cb3 = vi.fn()
        router.get('/api/endpoint', cb1)
        router.use(cb2)
        router.get('/somewhere', cb3)

        expect(router.routes.length).toBe(3)
        expect(router.routes[0]).toMatchObject({
            path: '/api/endpoint',
            handler: cb1,
        })
        expect(router.routes[1]).toMatchObject({
            path: null,
            handler: cb2,
        })
        expect(router.routes[2]).toMatchObject({
            path: '/somewhere',
            handler: cb3,
        })
    })

    test('with use(Router)', () => {
        const router = createRouter()
        const childRouter = createRouter()
        const cb1 = vi.fn()
        const cb2 = vi.fn()
        const cb3 = vi.fn()

        childRouter.get('/api/endpoint', cb1)
        childRouter.get('/api/endpoint/:id', cb2)
        router.use(childRouter).get('/somewhere', cb3)

        expect(router.routes.length).toBe(3)
        expect(router.routes[0]).toMatchObject({
            path: '/api/endpoint',
            handler: cb1,
        })
        expect(router.routes[1]).toMatchObject({
            path: '/api/endpoint/:id',
            handler: cb2,
        })
        expect(router.routes[2]).toMatchObject({
            path: '/somewhere',
            handler: cb3,
        })
    })

    test(`with use('/api', Router)`, () => {
        const router = createRouter()
        const childRouter = createRouter()
        const cb1 = vi.fn()
        const cb2 = vi.fn()
        const cb3 = vi.fn()
        childRouter.get('/users', cb1)
        childRouter.get('/groups', cb2)
        router.use('/api', childRouter).get('/somewhere', cb3)

        expect(router.routes.length).toBe(3)
        expect(router.routes[0]).toMatchObject({
            path: '/api/users',
            handler: cb1,
        })
        expect(router.routes[1]).toMatchObject({
            path: '/api/groups',
            handler: cb2,
        })
        expect(router.routes[2]).toMatchObject({
            path: '/somewhere',
            handler: cb3,
        })
    })

    describe('param matching', () => {
        test('single level parameter matching', async () => {
            const router = createRouter()
                .get('/user', vi.fn())
                .get('/user/:userId', vi.fn())
                .get('/user/:userId/:name', vi.fn())

            expect(router.routes[0].keys).toEqual([])
            expect(router.routes[1].keys).toMatchObject([{ name: 'userId' }])
            expect(router.routes[2].keys).toMatchObject([{ name: 'userId' }, { name: 'name' }])
        })

        test('multiple level parameter matching', async () => {
            const userRouter = createRouter()
                .get('/user', vi.fn())
                .get('/user/:userId', vi.fn())
                .get('/user/:userId/:name', vi.fn())

            const orderRouter = createRouter()
                .get('/orders', vi.fn())
                .get('/orders/:orderId', vi.fn())

            const router = createRouter().use('/api', userRouter).use('/api', orderRouter)

            expect(router.routes[0].path).toBe('/api/user')
            expect(router.routes[0].keys).toMatchObject([])

            expect(router.routes[1].path).toBe('/api/user/:userId')
            expect(router.routes[1].keys).toMatchObject([{ name: 'userId' }])

            expect(router.routes[2].path).toBe('/api/user/:userId/:name')
            expect(router.routes[2].keys).toMatchObject([{ name: 'userId' }, { name: 'name' }])

            expect(router.routes[3].path).toBe('/api/orders')
            expect(router.routes[3].keys).toMatchObject([])

            expect(router.routes[4].path).toBe('/api/orders/:orderId')
            expect(router.routes[4].keys).toMatchObject([{ name: 'orderId' }])
        })

        test.fails('match query string', async () => {
            const router = createRouter()
                .get('/?user=:userId', vi.fn())
                .get('/?user=:userId&name=:name', vi.fn())

            expect(router.routes[0].path).toBe('/?user=:userId')
            expect(router.routes[0].keys).toMatchObject([{ name: 'userId' }])
            expect(router.routes[1].path).toBe('/?user=:userId&nape=:name§')
            expect(router.routes[1].keys).toMatchObject([{ name: 'userId' }, { name: 'name' }])
        })
    })
})
