import { createServerSignalr } from '@fakehost/signalr'
import { hubs } from './hubs'

export const protocols = ['json', 'messagepack'] as const
export type Protocols = (typeof protocols)[number]

export type TestTarget = 'FAKE' | 'REMOTE'

export const getTestTarget = (): TestTarget => {
    const target = process.env.TEST_TARGET
    if (target === 'FAKE') {
        return 'FAKE'
    }
    if (target === 'REMOTE') {
        return 'REMOTE'
    }
    throw new Error(`Invalid test target: ${target}`)
}

export type TestEnv = {
    url: URL
    dispose: () => Promise<void>
}

export const testSetup = async (mode: TestTarget): Promise<TestEnv> => {
    switch (mode) {
        case 'FAKE': {
            const { dispose, url } = await createServerSignalr({
                url: new URL('http://localhost:0'),
                hubs: hubs,
                debug: false,
            })
            return {
                url,
                dispose: () => dispose(),
            }
        }
        case 'REMOTE': {
            const url = new URL(`http://localhost:${getSignalrDotNetPort()}`)
            return {
                url,
                dispose: () => Promise.resolve(),
            }
        }
    }
}

const getSignalrDotNetPort = () => {
    if (process.env.SIGNALR_REMOTE_PORT) {
        return parseInt(process.env.SIGNALR_REMOTE_PORT, 10)
    }
    return 5001
}
