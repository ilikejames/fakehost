import { UserControllerApi } from '@fakehost/rest-generated-client-api'
import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { TestEnv, testSetup, getTestTarget } from './testSetup'
import { router } from './router'

describe(`${getTestTarget()}: userRoute`, () => {
    let env: TestEnv

    beforeAll(async () => {
        env = await testSetup(getTestTarget(), router)
    })

    afterAll(() => {
        env.dispose()
    })

    test('me', async () => {
        const api = new UserControllerApi(env.config)
        const user = await api.me()
        expect(user).toMatchObject({
            username: expect.any(String),
        })
    })
})
