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

const getPort = async (options?: Partial<HostOptions>): Promise<number> => {
    if (process.env.SIGNALR_REMOTE_PORT) {
        return parseInt(process.env.SIGNALR_REMOTE_PORT, 10)
    }
    if (options?.port) {
        return options.port
    }
    return 5002
}

export const testSetup = async (mode: TestTarget): Promise<TestEnv> => {
    switch (mode) {
        case 'FAKE': {
            const host = new Host([chatHub, timeHub])
            const url = `http://localhost:${await host.port}`
            return {
                url,
                dispose: () => {
                    host.dispose()
                },
            }
        }
        case 'REMOTE': {
            const url = `http://localhost:${await getPort()}`
            return {
                url,
                dispose: () => undefined,
            }
        }
    }
}
