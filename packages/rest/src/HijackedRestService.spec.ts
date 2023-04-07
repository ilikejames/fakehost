import { describe, test, expect } from 'vitest'
import { HijackedRestService } from './HijackedRestService'
import { createRouter } from './createRouter'
import { enableLogger } from './logger'

describe('HijackedRestService', () => {
    enableLogger()

    const router = createRouter()
        .get('/api', (_, res) => {
            res.status(200)
            res.send('api')
            res.end()
        })
        .get('/api/users/:userId', (req, res) => {
            res.json({
                path: req.url,
                params: req.params,
            })
        })

    test('non hijacked call', async () => {
        const service = new HijackedRestService(new URL('http://localhost:3000'), router, {
            name: 'Test Http',
        })
        try {
            const result = await globalThis.fetch('http://example.com')
            const html = await result.text()
            expect(html).toContain('Example Domain')
        } finally {
            service.dispose()
        }
    })

    test('simple call', async () => {
        const service = new HijackedRestService(new URL('http://localhost:4000'), router, {
            name: 'Test Http',
        })
        try {
            const result = await globalThis.fetch('http://localhost:4000/api')
            expect(result.status).toBe(200)
            expect(await result.text()).toBe('api')
        } finally {
            service.dispose()
        }
    })
})
