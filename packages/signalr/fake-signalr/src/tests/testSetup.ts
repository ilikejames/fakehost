import { Host, HostOptions } from '../Host'
import { chatHub } from '../services/fakeChatHub'
import { timeHub } from '../services/fakeTimeStreamHub'

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
    url: string
    dispose: () => void
}

export const testSetup = async (options?: HostOptions): Promise<TestEnv> => {
    const host = new Host([chatHub, timeHub], options)
    const url = `http://localhost:${await host.port}`

    return {
        url,
        dispose: () => {
            host.dispose()
        },
    }
}
