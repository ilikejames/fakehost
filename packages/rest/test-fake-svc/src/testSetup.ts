import { HttpRestService, createRouter } from '@fakehost/fake-rest/server'
import { Configuration } from '@fakehost/rest-generated-client-api'
import { URL } from 'url'

export type TestTarget = 'FAKE' | 'REMOTE'

const ENV_TARGET = 'TEST_TARGET'

export const getTestTarget = (): TestTarget => {
    const target = process.env[ENV_TARGET]
    if (target === 'FAKE') {
        return 'FAKE'
    }
    if (target === 'REMOTE') {
        return 'REMOTE'
    }
    throw new Error(`Invalid test target: ${target}`)
}

export type TestEnv = {
    url: string
    config: Configuration
    dispose: () => Promise<void>
}

export const testSetup = async (
    target: TestTarget,
    router: ReturnType<typeof createRouter>,
): Promise<TestEnv> => {
    switch (target) {
        case 'FAKE': {
            const host = new HttpRestService(router)
            const url = getOpenApiRemoteUrl(await host.url)
            const config = new Configuration({ basePath: url })
            return {
                url,
                config,
                dispose: () => host.dispose(),
            }
        }
        case 'REMOTE': {
            const url = getOpenApiRemoteUrl(getRestRemoteUrl())
            const config = new Configuration({ basePath: url })
            return {
                config,
                url,
                dispose: () => Promise.resolve(),
            }
        }
        default: {
            throw new Error(
                `Invalid test target: ${target}. Set the environment variable ${ENV_TARGET} to 'FAKE' or 'REMOTE'.`,
            )
        }
    }
}

const getOpenApiRemoteUrl = (url: URL) => `${url.protocol}//${url.host}`

const getRestRemoteUrl = () => {
    if (process.env.REST_REMOTE_URL) {
        return new URL(process.env.REST_REMOTE_URL)
    }
    return new URL('http://localhost:8080')
}
