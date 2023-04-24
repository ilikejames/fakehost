import { describe, expect, test } from 'vitest'
import { createRouter } from '../createRouter'
import { ErrorHandler } from '../types'
import { getHost, targets } from './helper'

// Tests run across both the node service and the browser hijacked fetch
for (const target of targets) {
    describe(`${target}: error handling`, () => {
        test('404 handler', async () => {
            const router = createRouter()
                .get('/echo', (_, res) => {
                    res.status(200).send('ok')
                })
                .use((_, res) => {
                    res.status(404).send('Not found')
                })
            const { host, url } = await getHost(target, router)
            try {
                const response = await fetch(new URL('/not-found', url))
                expect(await response.text()).toEqual('Not found')
                expect(await response.status).toEqual(404)

                const non404Response = await fetch(new URL('/echo', url))
                expect(await non404Response.status).toEqual(200)
            } finally {
                host.dispose()
            }
        })

        test('default error', async () => {
            const router = createRouter().get('/broken', () => {
                throw new Error('Broken')
            })
            const { host, url } = await getHost(target, router)
            try {
                const response = await fetch(new URL('/broken', url))
                expect(await response.status).toEqual(500)
                expect(await response.text()).toContain('Internal server error')
            } finally {
                host.dispose()
            }
        })

        test('throw Error', async () => {
            const errorHandler: ErrorHandler = (err, req, res) => {
                res.status(500).send(err.message)
            }
            const router = createRouter()
                .get('/broken', () => {
                    throw new Error('Broken')
                })
                .useError(errorHandler)

            const { host, url } = await getHost(target, router)

            try {
                const response = await fetch(new URL('/broken', url))
                expect(response.status).toEqual(500)
                expect(await response.text()).toEqual('Broken')
            } finally {
                host.dispose()
            }
        })

        test('rejected promises', async () => {
            const errorHandler: ErrorHandler = (err, req, res) => {
                res.status(500).send(err.message)
            }
            const router = createRouter()
                .get('/broken-promise', () => Promise.reject('Broken promise'))
                .useError(errorHandler)

            const { host, url } = await getHost(target, router)

            try {
                const response = await fetch(new URL('/broken-promise', url))
                expect(response.status).toEqual(500)
                expect(await response.text()).toEqual('Broken promise')
            } finally {
                host.dispose()
            }
        })
    })
}
