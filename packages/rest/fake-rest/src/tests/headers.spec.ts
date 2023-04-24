import { describe, expect, test } from 'vitest'
import { createRouter } from '../createRouter'
import { getHost, targets } from './helper'

// Tests run across both the node service and the browser hijacked fetch
for (const target of targets) {
    describe(`${target}: headers`, () => {
        test('set headers', async () => {
            const router = createRouter().get('/echo', (_, res) => {
                res.setHeader('x-foo', 'bar')
                res.setHeader('x-baz', 'qux')
                res.status(200).send('ok')
            })
            const { host, url } = await getHost(target, router)
            try {
                const response = await fetch(new URL('/echo', url))
                expect(response.headers.get('x-foo')).toEqual('bar')
                expect(response.headers.get('x-baz')).toEqual('qux')
            } finally {
                host.dispose()
            }
        })
    })
}
