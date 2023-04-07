import { describe, test, expect } from 'vitest'
import { HttpRestService } from './HttpRestService'
import { createRouter } from './createRouter'
import fetch from 'isomorphic-fetch'
import { enableLogger } from './logger'

describe('HttpRestService', () => {
    enableLogger()

    const router = createRouter()
        .get('/api', (req, res) => {
            res.send('api')
            res.end()
        })
        .get('/api/users/:userId', (req, res) => {
            res.json({
                path: req.url,
                params: req.params,
            })
        })

    test('simple call', async () => {
        const service = new HttpRestService(router, { name: 'Test Http' })
        const url = await service.url
        try {
            const res = await fetch(`${url.toString().slice(0, -1)}/api`)
            expect(await res.text()).toBe('api')
            expect(res.status).toBe(200)
        } finally {
            await service.dispose()
        }
    })

    test('json params', async () => {
        const service = new HttpRestService(router, { name: 'Test Http' })
        const url = await service.url
        try {
            const res = await fetch(`${url.toString().slice(0, -1)}/api/users/123`)
            expect(await res.json()).toMatchObject({
                path: '/api/users/123',
                params: {
                    userId: '123',
                },
            })
            expect(res.status).toBe(200)
            expect(res.headers.get('content-type')).toBe('application/json; charset=utf-8')
        } finally {
            await service.dispose()
        }
    })
})
