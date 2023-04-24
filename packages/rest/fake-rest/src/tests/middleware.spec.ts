import { describe, expect, test } from 'vitest'
import { createRouter } from '../createRouter'
import { getHost, targets } from './helper'

// Tests run across both the node service and the browser hijacked fetch
for (const target of targets) {
    describe(`${target}: middleware`, () => {
        test('middleware is called in order', async () => {
            const router = createRouter()
                .use((req, _, next) => {
                    // set a property on the request for downstream routes to use
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (req as any).foo = 'bar'
                    next()
                })
                .get('/echo', (req, res) => {
                    const request = req as typeof req & { foo: string }
                    expect(request.foo).toBe('bar')
                    res.json({
                        foo: request.foo,
                    })
                })

            const { host, url } = await getHost(target, router)
            try {
                const response = await fetch(new URL('/echo', url))
                expect(await response.json()).toEqual({ foo: 'bar' })
            } finally {
                host.dispose()
            }
        })

        test('middleware handlers can be async', async () => {
            const router = createRouter()
                .use(async (req, _, next) => {
                    // set a property "foo" on the request for downstream routes to use
                    await new Promise<void>(resolve => {
                        setTimeout(() => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (req as any).foo = 'bar'
                            resolve()
                        }, 100)
                    })
                    next()
                })
                .use(async (req, _, next) => {
                    // set a property "baz" on the request for downstream routes to use
                    await new Promise<void>(resolve => {
                        setTimeout(() => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            (req as any).baz = 'quz'
                            resolve()
                        }, 100)
                    })
                    next()
                })
                .get('/echo', (req, res) => {
                    const request = req as typeof req & { foo: string; baz: string }
                    expect(request.foo).toBe('bar')
                    expect(request.baz).toBe('quz')
                    res.json({
                        foo: request.foo,
                        baz: request.baz,
                    })
                })

            const { host, url } = await getHost(target, router)
            try {
                const response = await fetch(new URL('/echo', url))
                const json = await response.json()
                expect(json).toEqual({ foo: 'bar', baz: 'quz' })
            } finally {
                host.dispose()
            }
        })
    })
}
