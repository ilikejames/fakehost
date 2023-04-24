import { createRouter, cors } from '@fakehost/fake-rest'

export const router = createRouter()
    .use(cors())
    .get('/api/me', (_, res) => {
        res.json({ username: 'test-user' })
    })
