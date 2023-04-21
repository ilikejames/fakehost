import { describe, expect, test } from 'vitest'
import { getMockedFetch } from '../HijackedRestService'
import { echoRouter, getHost } from './helper'

describe(`mockFetch`, () => {
    test('mockFetch will work if there is no fakes attached', async () => {
        const fetch = getMockedFetch
        const result = await fetch('http://example.com')
        const html = await result.text()
        expect(html).toContain('Example Domain')
    })

    test('mockFetch will call the fake', async () => {
        const { host, url } = await getHost('FakeHijacked', echoRouter('GET', '/echo'), {
            port: 9000,
        })

        try {
            const fetch = getMockedFetch
            const resultFake = await fetch(new URL('/echo', url))
            expect((await resultFake.json()).host).toBe(url.host)

            const realResult = await fetch('http://example.com')
            const html = await realResult.text()
            expect(html).toContain('Example Domain')
        } finally {
            await host.dispose()
        }
    })
})
