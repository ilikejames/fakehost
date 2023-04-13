import { HijackedRestService } from '@fakehost/fake-rest/browser'
import { createRouter, enableLogger } from '@fakehost/fake-rest'

enableLogger()

const router = createRouter().get('/api/me', (_, res) => {
    res.json({ username: 'test-user' })
})

new HijackedRestService(new URL('http://example.com'), router, { name: 'example.com' })
