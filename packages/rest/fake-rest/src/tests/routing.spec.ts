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
            const { host: host9000, url: url9000 } = await getHost(
                target,
                echoRouter('GET', '/echo'),
                {
                    port: 9000,
                },
            )
            const { host: host9001, url: url9001 } = await getHost(
                target,
                echoRouter('GET', '/echo'),
                {
                    port: 9001,
                },
            )

            try {
                const response9000_1 = await fetch(new URL('/echo', url9000))
                const response9001_1 = await fetch(new URL('/echo', url9001))
                const responseReal_1 = await fetch(new URL('http://example.com'))

                expect((await response9000_1.json()).host).toBe(url9000.host)
                expect((await response9001_1.json()).host).toBe(url9001.host)
                expect(await responseReal_1.text()).toContain('Example')

                // tear down host 9000
                await host9000.dispose()

                // and can not longer be reached
                await expect(fetch(new URL('/echo', url9000))).rejects.toThrow()

                // can still reach the other host
                const response9001_2 = await fetch(new URL('/echo', url9001))
                expect((await response9001_2.json()).host).toBe(url9001.host)
                // and example.com
                const responseReal_2 = await fetch(new URL('http://example.com'))
                expect(await responseReal_2.text()).toContain('Example')

                // until we tear it down too
                await host9001.dispose()
                // and 9001 cannot be reached any more
                await expect(fetch(new URL('/echo', url9001))).rejects.toThrow()

                // but example.com still works
                const responseReal_3 = await fetch(new URL('http://example.com'))
                expect(await responseReal_3.text()).toContain('Example')
            } finally {
                Promise.all([host9000.dispose(), host9001.dispose()])
            }
        }, 15_000)
    })
}
