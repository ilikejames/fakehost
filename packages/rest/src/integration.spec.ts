import { describe, expect, test } from 'vitest'
import { createRouter } from './createRouter'
import { Methods, RestRouter } from './types'
import { HijackedRestService } from './HijackedRestService'
import { HttpRestService } from './HttpRestService'

type Target = 'FakeHijacked' | 'FakeService' //  'Express' |

const targets: ReadonlyArray<Target> = ['FakeService'] // ['FakeHijacked'] //, 'FakeService'] as const

for (const target of targets) {
    describe(`${target}: fake rest`, () => {
        test('requests to out-of-scope urls should pass through', async () => {
            const { host } = await getHost(target, createRouter())
            try {
                const result = await globalThis.fetch('http://example.com')
                const html = await result.text()
                expect(html).toContain('Example Domain')
            } finally {
                host.dispose()
            }
        })

        //  'post', 'put', 'delete', 'patch', 'head', 'options'
        const methods: ReadonlyArray<Methods> = ['GET'] as const

        for (const method of methods) {
            test(`${method} to plain endpoint`, async () => {
                const { host, url } = await getHost(target, echoRouter(method, '/echo'))
                try {
                    const response = await globalThis.fetch(new URL('/echo', url), {
                        method: method.toUpperCase(),
                    })

                    expect(response.status).toBe(200)
                    expect(await response.json()).toMatchObject({
                        method: method,
                        url: '/echo',
                        params: expect.objectContaining({}),
                        query: expect.objectContaining({}),
                    })
                } finally {
                    await host.dispose()
                }
            })

            test(`${method} to param endpoint`, async () => {
                const { host, url } = await getHost(
                    target,
                    echoRouter(method, '/echo/user/:userId/:name'),
                )
                try {
                    const endpoint = '/echo/user/23/the-name'
                    const response = await globalThis.fetch(new URL(endpoint, url), {
                        method: method.toUpperCase(),
                    })
                    expect(response.status).toBe(200)
                    expect(await response.json()).toMatchObject({
                        method: method,
                        url: endpoint,
                        params: expect.objectContaining({ userId: '23', name: 'the-name' }),
                        query: expect.objectContaining({}),
                    })
                } finally {
                    await host.dispose()
                }
            })

            test(`${method} with querystring`, async () => {
                const { host, url } = await getHost(
                    target,
                    echoRouter(method, '/echo/user/:userId/:name'),
                )
                try {
                    const endpoint = '/echo/user/23/the-name?foo=bar&baz=qux'
                    const response = await globalThis.fetch(new URL(endpoint, url), {
                        method: method.toUpperCase(),
                    })
                    expect(response.status).toBe(200)
                    expect(await response.json()).toMatchObject({
                        method: method,
                        url: endpoint,
                        params: expect.objectContaining({ userId: '23', name: 'the-name' }),
                        query: expect.objectContaining({ foo: 'bar', baz: 'qux' }),
                    })
                } finally {
                    host.dispose()
                }
            })
        }

        test('multiple hosts', async () => {
            const { host: host1, url: url1 } = await getHost(target, echoRouter('GET', '/echo'), {
                port: 9000,
            })
            const { host: host2, url: url2 } = await getHost(target, echoRouter('GET', '/echo'), {
                port: 9001,
            })

            try {
                const response1 = await fetch(new URL('/echo', url1))
                const response2 = await fetch(new URL('/echo', url2))

                expect((await response1.json()).host).toBe(url1.host)
                expect((await response2.json()).host).toBe(url2.host)

                // tear down host1
                await host1.dispose()
                // and can not longer be reached
                await expect(fetch(new URL('/echo', url1))).rejects.toThrow()

                // can still reach the other host
                const response3 = await fetch(new URL('/echo', url2))
                expect((await response3.json()).host).toBe(url2.host)

                // until we tear it down too
                await host2.dispose()
                // and it cannot be reached anymore
                await expect(fetch(new URL('/echo', url2))).rejects.toThrow()
            } finally {
                await Promise.all([host1.dispose(), host2.dispose()])
            }
        }, 15_000)

        test('response text()', async () => {
            const { host, url } = await getHost(target, echoRouter('GET', '/echo'))
            try {
                const response = await fetch(new URL('/echo', url))
                expect(await response.text()).toBe(
                    JSON.stringify({
                        host: url.host,
                        method: 'GET',
                        url: '/echo',
                        params: {},
                        query: {},
                    }),
                )
            } finally {
                host.dispose()
            }
        })

        test.skip('body parameters', async () => {
            // TODO:
        })

        test.skip('middleware', async () => {
            // TODO:
        })

        test.skip('404 handler', async () => {
            // TODO:
        })

        test.skip('exception response', async () => {
            // TODO:
        })
    })
}

const getHost = async (
    mode: Target,
    router: RestRouter,
    options: { port: number } = { port: 3000 },
) => {
    switch (mode) {
        case 'FakeHijacked': {
            const url = new URL(`http://remote-url:${options.port}`)
            const host = new HijackedRestService(url, router)
            return {
                host,
                url,
            }
        }
        case 'FakeService': {
            const host = new HttpRestService(router)
            return {
                host,
                url: await host.url,
            }
        }
    }
}

const echoRouter = (method: Methods, endPoint: string) =>
    createRouter().METHOD(method, endPoint, (req, res) => {
        res.json({
            host: req.host,
            method: req.method,
            url: req.url,
            params: req.params,
            query: req.query,
        })
    })
