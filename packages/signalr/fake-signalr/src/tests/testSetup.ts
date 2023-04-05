import { createServer } from 'http'
import { HostOptions } from '../Host'
import { chatHub } from '../services/fakeChatHub'
import { timeHub } from '../services/fakeTimeStreamHub'
import { v4 as uuid } from 'uuid'
import { ConnectionId } from '@fakehost/exchange'
import { WsHost, enableLogger } from '@fakehost/host'

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
            const http = createServer()
            http.on('request', (_, res) => {
                res.write(JSON.stringify(signalrHandshake(uuid() as ConnectionId)))
                res.end()
            })
            http.listen(0)

            const wsHost = new WsHost({ server: http })
            hubs.forEach(hub => hub.setHost(wsHost))

            const hostUrl = await wsHost.url
            const url = new URL(
                `http://${hostUrl.hostname}${hostUrl.port ? ':' + hostUrl.port : ''}`,
            )

            console.log('url =', url)
            return {
                url: url,
                dispose: () => {
                    http.close()
                    wsHost.dispose()
                },
            }
        }
        case 'REMOTE': {
            const url = new URL(`http://localhost:${await getPort()}`)
            return {
                url,
                dispose: () => undefined,
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
