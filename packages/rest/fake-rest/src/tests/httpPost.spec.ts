import { describe, expect, test } from 'vitest'
import { createRouter } from '../createRouter'
import { getHost, targets } from './helper'

// Tests run across both the node service and the browser hijacked fetch
for (const target of targets) {
    describe(`${target}: http POST`, () => {
        test('POST empty', async () => {
            const router = createRouter().post('/echo', (req, res) => {
                res.json({
                    payload: req.body,
                })
                res.end()
            })
            const { host, url } = await getHost(target, router)
            try {
                const response = await fetch(new URL('/echo', url), {
                    method: 'POST',
                })
                const json = await response.json()
                expect(json).toEqual({ payload: null })
            } finally {
                host.dispose()
            }
        })

        test('POST json', async () => {
            const payload = { foo: 'bar' } as const
            const router = createRouter().post('/echo', (req, res) => {
                expect(req.body).toEqual(payload)
                res.json({
                    payload: req.body,
                })
                res.end()
            })
            const { host, url } = await getHost(target, router)
            try {
                const response = await fetch(new URL('/echo', url), {
                    method: 'POST',
                    body: JSON.stringify({ foo: 'bar' }),
                    headers: {
                        'content-type': 'application/json',
                    },
                })
                expect(await response.json()).toEqual({ payload })
            } finally {
                host.dispose()
            }
        })

        test('POST formData', async () => {
            const payload = { foo: 'bar', baz: 'qux' } as const
            const router = createRouter().post('/echo', (req, res) => {
                expect(req.body).toEqual(payload)
                res.json({
                    payload: req.body,
                })
                res.end()
            })
            const { host, url } = await getHost(target, router)
            try {
                const formData = new FormData()
                Object.entries(payload).forEach(([key, value]) => {
                    formData.append(key, value)
                })
                const response = await fetch(new URL('/echo', url), {
                    method: 'POST',
                    body: formData,
                })
                expect(await response.json()).toEqual({ payload })
            } finally {
                host.dispose()
            }
        })

        test('POST formUrlEncoded', async () => {
            const payload = { foo: 'bar', baz: 'qux' } as const
            const router = createRouter().post('/echo', (req, res) => {
                expect(req.body).toEqual(payload)
                res.json({ payload: req.body })
                res.end()
            })
            const { host, url } = await getHost(target, router)
            try {
                const response = await fetch(new URL('/echo', url), {
                    method: 'POST',
                    body: new URLSearchParams(payload),
                })
                expect(await response.json()).toEqual({ payload })
            } finally {
                host.dispose()
            }
        })
    })
}
