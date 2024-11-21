import { test, describe, expect, beforeAll, afterAll } from 'vitest'
import { getHost, targets } from './helper'
import { createRouter } from '../createRouter'
import { HttpRest } from '../host/types'

for (const target of targets) {
    describe(`${target}: routing querystring`, () => {
        let host: HttpRest

        beforeAll(async () => {
            const router = createRouter()
                .get('/echo', (req, res) => {
                    res.json({ path: '/echo', qs: req.query })
                })
                .get('/echo/:id', (req, res) => {
                    res.json({ path: `/echo/${req.params.id}`, qs: req.query })
                })
                .get('/echo\\?route=:quotes', (req, res) => {
                    res.send(
                        'This will never hit, instead it will be `/echo` route that is hit',
                    ).end()
                })
            host = await getHost(target, router)
        })

        afterAll(() => {
            host?.dispose()
        })

        test('/echo', async () => {
            const response = await fetch(new URL('/echo', await host.url))
            expect(await response.json()).toMatchObject({ path: '/echo', qs: {} })
        })

        test('/echo/23', async () => {
            const response = await fetch(new URL('/echo/23', await host.url))
            expect(await response.json()).toMatchObject({ path: '/echo/23', qs: {} })
        })

        test('/echo?route=quotes', async () => {
            const response = await fetch(new URL('/echo?route=quotes', await host.url))
            expect(await response.json()).toMatchObject({ path: '/echo', qs: { route: 'quotes' } })
        })
    })
}
