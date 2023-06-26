import { ConnectionId } from '@fakehost/exchange'
import { createRouter, cors } from '@fakehost/fake-rest'
import { v4 as uuid } from 'uuid'

export const restRouter = createRouter()
    .use(cors())
    .use((_, res) => {
        const connectionId = uuid() as ConnectionId
        res.json(signalrHandshake(connectionId))
    })

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
