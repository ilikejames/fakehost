import { createRouter } from '@fakehost/fake-rest'
import { UserControllerApi } from '@fakehost/rest-generated-client-api'

const getUser: UserControllerApi['me'] = () => Promise.resolve({ username: 'test-user' })

export const userRoute = createRouter().get('/me', async (_, res) => {
    res.json(await getUser())
})
