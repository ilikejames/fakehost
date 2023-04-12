import { WsHost, enableLogger, ConnectionId, WsStandaloneOptions } from '@fakehost/host'
import { HttpRestService, createRouter } from '@fakehost/fake-rest'
import { v4 as uuid } from 'uuid'
import { chatHub } from '../services/fakeChatHub'
import { timeHub } from '../services/fakeTimeStreamHub'

enableLogger()

const hubs = [chatHub, timeHub] as const

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

const getPort = async (options?: Partial<WsStandaloneOptions>): Promise<number> => {
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
            const restRouter = createRouter().use((_, res) => {
                const connectionId = uuid() as ConnectionId
                res.json(signalrHandshake(connectionId))
            })
            const rest = new HttpRestService(restRouter)
            const wsHost = new WsHost({ server: rest.server })
            hubs.forEach(hub => hub.setHost(wsHost))

            const hostUrl = await wsHost.url
            const url = new URL(
                `http://${hostUrl.hostname}${hostUrl.port ? ':' + hostUrl.port : ''}`,
            )

            return {
                url: url,
                dispose: async () => {
                    await Promise.all([rest.dispose(), wsHost.dispose()])
                },
            }
        }
        case 'REMOTE': {
            const url = new URL(`http://localhost:${await getPort()}`)
            return {
                url,
                dispose: () => Promise.resolve(),
            }
        }
    }
}

const signalrHandshake = (connectionId: ConnectionId) => ({
    negotiateVersion: 1,
    connectionId: connectionId,
    connectionToken: connectionId,
    availableTransports: [
        { transport: 'WebSockets', transferFormats: ['Text', 'Binary'] },
        { transport: 'ServerSentEvents', transferFormats: ['Text'] },
        { transport: 'LongPolling', transferFormats: ['Text', 'Binary'] },
    ],
})
