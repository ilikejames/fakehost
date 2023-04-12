import { describe, expect, test } from 'vitest'
import { createRouter } from '../createRouter'
import { echoRouter, getHost, targets } from './helper'

// Tests run across both the node service and the browser hijacked fetch
for (const target of targets) {
    describe(`${target}: routing to specific hosts only`, () => {
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

        test(`requests are directed to the correct host of many`, async () => {
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
                Promise.all([host1.dispose(), host2.dispose()])
            }
        }, 15_000)
    })
}
