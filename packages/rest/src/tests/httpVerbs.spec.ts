import { describe, expect, test } from 'vitest'
import { echoRouter, getHost, targets } from './helper'
import { Methods } from '../types'

// Tests run across both the node service and the browser hijacked fetch
for (const target of targets) {
    // Tests run across all http methods
    const methods: ReadonlyArray<Methods> = ['GET', 'POST'] as const
    for (const method of methods) {
        describe(`${target}: http ${method}`, () => {
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
                    host.dispose()
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
                    host.dispose()
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

            test('response text()', async () => {
                const { host, url } = await getHost(target, echoRouter(method, '/echo'))
                try {
                    const response = await globalThis.fetch(new URL('/echo', url), {
                        method: method.toUpperCase(),
                    })
                    expect(await response.text()).toBe(
                        JSON.stringify({
                            host: url.host,
                            method: method,
                            url: '/echo',
                            params: {},
                            query: {},
                        }),
                    )
                } finally {
                    host.dispose()
                }
            })
        })
    }
}
